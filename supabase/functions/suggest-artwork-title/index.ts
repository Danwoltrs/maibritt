import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

// Haiku 4.5 pricing: $1/M input, $5/M output
function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 1 + (outputTokens / 1_000_000) * 5;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image || !mimeType) {
      return jsonResponse({ error: "Missing image or mimeType" }, 400);
    }

    const prompt = [
      "You are helping Mai-Britt Wolthers, a Danish-Brazilian contemporary artist living in Brazil, name her artwork.",
      "She is deeply inspired by all Brazilian biomes — the Amazon, Cerrado, Caatinga, Atlantic Forest, Pantanal, and Pampas.",
      "Analyze the colors, forms, geometry, lines, textures, and emotional atmosphere of this image.",
      "Create a unique, poetic, and evocative title that feels personal to her artistic vision.",
      "Avoid generic or cliché art titles. Be creative and specific to what you see.",
      "Provide the title in both English and Brazilian Portuguese.",
      'Respond ONLY with valid JSON: {"titleEn": "English Title", "titlePt": "Titulo em Portugues"}',
    ].join(" ");

    const model = "claude-haiku-4-5-20251001";

    const body = {
      model,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: image,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API error:", errorBody);
      return jsonResponse({ error: "Failed to get AI suggestion" }, 502);
    }

    const data = await response.json();
    const textContent = data.content?.find((c: any) => c.type === "text");
    const text = textContent?.text || "";

    // Extract token usage
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const cost = estimateCost(inputTokens, outputTokens);

    // Log usage to ai_usage_log (fire-and-forget)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from("ai_usage_log").insert({
          function_name: "suggest-artwork-title",
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          estimated_cost: cost,
        });
      } catch (logError) {
        console.error("Failed to log AI usage:", logError);
      }
    }

    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return jsonResponse(
        { error: "Could not parse AI response", raw: text },
        500
      );
    }

    const suggestion = JSON.parse(jsonMatch[0]);

    return jsonResponse({
      ...suggestion,
      usage: { inputTokens, outputTokens, estimatedCost: cost },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
