create table if not exists public.job_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  from_status text null,
  to_status text null,
  occurred_at timestamptz not null,
  created_by uuid null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists job_events_company_id_idx on public.job_events(company_id);
create index if not exists job_events_job_id_idx on public.job_events(job_id);

alter table public.job_events enable row level security;

create policy "Job events scoped by owner company"
on public.job_events
for all
using (
  exists (
    select 1
    from public.companies
    where companies.id = job_events.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.companies
    where companies.id = job_events.company_id
      and companies.owner_id = auth.uid()
  )
);
