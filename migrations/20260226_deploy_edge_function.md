# Deploy: suggest-artwork-title Edge Function

## 1. Run the migration

Execute `20260226_create_ai_usage_log.sql` in the Supabase SQL Editor.

## 2. Deploy the edge function

```bash
supabase functions deploy suggest-artwork-title
```

## 3. Set required secrets (if not already set)

```bash
supabase secrets set ANTHROPIC_API_KEY=your_key_here
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available automatically in edge functions.

## What changed

- All responses now include CORS headers (previously missing on error responses, causing browser failures)
- After each Anthropic API call, token usage is extracted and logged to `ai_usage_log`
- Cost is estimated using Haiku 4.5 pricing: $1/M input, $5/M output
- Response now includes `usage: { inputTokens, outputTokens, estimatedCost }` alongside the title suggestion
