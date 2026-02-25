const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'Missing image or mimeType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const prompt = [
      "You are an art curator helping a contemporary artist name their artwork.",
      "Look at this artwork image and suggest a poetic, evocative title.",
      "Provide the title in both English and Brazilian Portuguese.",
      'Respond ONLY with valid JSON: {"titleEn": "English Title", "titlePt": "Titulo em Portugues"}'
    ].join(" ");

    const body = {
      model: "claude-haiku-4-5-20251001",
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
      return new Response(
        JSON.stringify({ error: "Failed to get AI suggestion" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const textContent = data.content?.find((c: any) => c.type === "text");
    const text = textContent?.text || "";

    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return new Response(
        JSON.stringify({ error: "Could not parse AI response", raw: text }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const suggestion = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(suggestion), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
