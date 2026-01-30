create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_id uuid not null references public.jobs(id) on delete cascade,
  old_status text null,
  new_status text not null,
  changed_at timestamptz not null,
  changed_by uuid null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint order_status_events_status_check check (
    new_status in ('scheduled', 'in_progress', 'done', 'canceled')
  )
);

create index if not exists order_status_events_order_idx
  on public.order_status_events(order_id, changed_at desc);

create index if not exists order_status_events_company_idx
  on public.order_status_events(company_id);

alter table public.order_status_events enable row level security;

create policy "Order status events scoped by owner company"
on public.order_status_events
for all
using (
  exists (
    select 1
    from public.companies
    where companies.id = order_status_events.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.companies
    where companies.id = order_status_events.company_id
      and companies.owner_id = auth.uid()
  )
);
