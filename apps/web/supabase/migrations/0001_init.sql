create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  industry text null,
  email text null,
  phone text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  state text null,
  zip_code text null,
  country text null default 'USA',
  logo_url text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  email text null,
  phone text null,
  role text not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint employees_role_check check (role in ('owner', 'admin', 'employee'))
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text null,
  phone text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  state text null,
  zip_code text null,
  country text null default 'USA',
  notes text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid null references public.customers(id) on delete set null,
  customer_name text null,
  title text null,
  scheduled_date date not null,
  scheduled_time time null,
  expected_completion date null,
  status text not null default 'scheduled',
  notes text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint jobs_status_check check (status in ('scheduled', 'in_progress', 'done', 'canceled'))
);

create table if not exists public.job_assignments (
  job_id uuid references public.jobs(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete cascade,
  primary key (job_id, employee_id)
);

drop trigger if exists set_timestamp_companies on public.companies;
create trigger set_timestamp_companies
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_timestamp_employees on public.employees;
create trigger set_timestamp_employees
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_timestamp_customers on public.customers;
create trigger set_timestamp_customers
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_timestamp_jobs on public.jobs;
create trigger set_timestamp_jobs
before update on public.jobs
for each row execute function public.set_updated_at();

alter table public.companies enable row level security;
alter table public.employees enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignments enable row level security;

create policy "Companies are scoped to owner"
on public.companies
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Employees scoped by owner company"
on public.employees
for all
using (
  exists (
    select 1
    from public.companies
    where companies.id = employees.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.companies
    where companies.id = employees.company_id
      and companies.owner_id = auth.uid()
  )
);

create policy "Customers scoped by owner company"
on public.customers
for all
using (
  exists (
    select 1
    from public.companies
    where companies.id = customers.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.companies
    where companies.id = customers.company_id
      and companies.owner_id = auth.uid()
  )
);

create policy "Jobs scoped by owner company"
on public.jobs
for all
using (
  exists (
    select 1
    from public.companies
    where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.companies
    where companies.id = jobs.company_id
      and companies.owner_id = auth.uid()
  )
);

create policy "Assignments scoped by job company"
on public.job_assignments
for all
using (
  exists (
    select 1
    from public.jobs
    join public.companies on companies.id = jobs.company_id
    where jobs.id = job_assignments.job_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.jobs
    join public.companies on companies.id = jobs.company_id
    where jobs.id = job_assignments.job_id
      and companies.owner_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', false)
on conflict (id) do nothing;

create policy "Company logos read"
on storage.objects
for select
using (
  bucket_id = 'company-logos'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
);

create policy "Company logos insert"
on storage.objects
for insert
with check (
  bucket_id = 'company-logos'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
);

create policy "Company logos update"
on storage.objects
for update
using (
  bucket_id = 'company-logos'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'company-logos'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
);

create policy "Company logos delete"
on storage.objects
for delete
using (
  bucket_id = 'company-logos'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
);
