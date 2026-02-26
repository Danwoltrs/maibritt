-- Track AI API usage and costs
create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  estimated_cost numeric(10,6) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_log enable row level security;

create policy "Allow authenticated read" on public.ai_usage_log
  for select to authenticated using (true);

create policy "Allow anon and authenticated insert" on public.ai_usage_log
  for insert with check (true);
