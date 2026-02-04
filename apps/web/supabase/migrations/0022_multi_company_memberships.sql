create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint company_memberships_role_check check (role in ('owner', 'admin', 'member')),
  constraint company_memberships_status_check check (status in ('active', 'invited', 'inactive')),
  unique (company_id, user_id)
);

create index if not exists company_memberships_user_idx
  on public.company_memberships(user_id);

create index if not exists company_memberships_company_idx
  on public.company_memberships(company_id);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_active_company_id uuid null references public.companies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp_user_profiles on public.user_profiles;
create trigger set_timestamp_user_profiles
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.company_memberships enable row level security;
alter table public.user_profiles enable row level security;

create or replace function public.has_active_membership(company_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships
    where company_memberships.company_id = company_uuid
      and company_memberships.user_id = auth.uid()
      and company_memberships.status = 'active'
  );
$$;

create or replace function public.is_company_admin(company_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships
    where company_memberships.company_id = company_uuid
      and company_memberships.user_id = auth.uid()
      and company_memberships.status = 'active'
      and company_memberships.role in ('owner', 'admin')
  );
$$;

create or replace function public.has_active_membership_for_job(job_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs
    where jobs.id = job_uuid
      and public.has_active_membership(jobs.company_id)
  );
$$;

create or replace function public.has_active_membership_for_order(order_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs
    where jobs.id = order_uuid
      and public.has_active_membership(jobs.company_id)
  );
$$;

create policy "Members can view own memberships"
on public.company_memberships
for select
using (user_id = auth.uid());

create policy "Users can manage own profile"
on public.user_profiles
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Members can view companies"
on public.companies
for select
using (public.has_active_membership(id));

create policy "Members can view employees"
on public.employees
for select
using (public.has_active_membership(company_id));

create policy "Admins can manage employees"
on public.employees
for insert
with check (public.is_company_admin(company_id));

create policy "Admins can update employees"
on public.employees
for update
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

create policy "Admins can delete employees"
on public.employees
for delete
using (public.is_company_admin(company_id));

create policy "Members can view customers"
on public.customers
for select
using (public.has_active_membership(company_id));

create policy "Members can manage customers"
on public.customers
for all
using (public.has_active_membership(company_id))
with check (public.has_active_membership(company_id));

create policy "Members can view customer addresses"
on public.customer_addresses
for select
using (public.has_active_membership(company_id));

create policy "Members can manage customer addresses"
on public.customer_addresses
for all
using (public.has_active_membership(company_id))
with check (public.has_active_membership(company_id));

create policy "Members can view jobs"
on public.jobs
for select
using (public.has_active_membership(company_id));

create policy "Members can manage jobs"
on public.jobs
for all
using (public.has_active_membership(company_id))
with check (public.has_active_membership(company_id));

create policy "Members can view job assignments"
on public.job_assignments
for select
using (public.has_active_membership_for_job(job_id));

create policy "Members can manage job assignments"
on public.job_assignments
for all
using (public.has_active_membership_for_job(job_id))
with check (public.has_active_membership_for_job(job_id));

create policy "Members can view order status events"
on public.order_status_events
for select
using (public.has_active_membership_for_order(order_id));

create policy "Members can manage order status events"
on public.order_status_events
for all
using (public.has_active_membership_for_order(order_id))
with check (public.has_active_membership_for_order(order_id));

create policy "Members can view job events"
on public.job_events
for select
using (public.has_active_membership_for_job(job_id));

create policy "Members can manage job events"
on public.job_events
for all
using (public.has_active_membership_for_job(job_id))
with check (public.has_active_membership_for_job(job_id));

create policy "Admins can manage invites"
on public.invites
for all
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

insert into public.company_memberships (company_id, user_id, role, status)
select companies.id, companies.owner_id, 'owner', 'active'
from public.companies
on conflict (company_id, user_id) do nothing;

insert into public.company_memberships (company_id, user_id, role, status)
select
  employees.company_id,
  employees.user_id,
  case
    when employees.role = 'owner' then 'owner'
    when employees.role = 'admin' then 'admin'
    else 'member'
  end,
  case when employees.is_active then 'active' else 'inactive' end
from public.employees
where employees.user_id is not null
on conflict (company_id, user_id) do nothing;

insert into public.user_profiles (user_id)
select distinct user_id
from public.company_memberships
on conflict (user_id) do nothing;
