alter table if exists public.customers
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists avatar_url text null,
  add column if not exists company_name text null;

update public.customers
set
  first_name = coalesce(first_name, split_part(name, ' ', 1)),
  last_name = coalesce(
    last_name,
    nullif(trim(substring(name from position(' ' in name) + 1)), ''),
    split_part(name, ' ', 1)
  );

alter table public.customers
  alter column first_name set not null,
  alter column last_name set not null;

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text not null,
  label text null,
  address_line1 text not null,
  address_line2 text null,
  city text not null,
  state text not null,
  zip_code text not null,
  country text not null default 'USA',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint customer_addresses_type_check check (type in ('residential', 'business'))
);

create index if not exists customer_addresses_company_customer_idx
  on public.customer_addresses(company_id, customer_id);

create index if not exists customer_addresses_customer_idx
  on public.customer_addresses(customer_id);

create unique index if not exists customer_addresses_primary_unique
  on public.customer_addresses(customer_id)
  where is_primary;

alter table public.customer_addresses enable row level security;

create policy "Customer addresses scoped by owner company"
on public.customer_addresses
for all
using (
  exists (
    select 1
    from public.companies
    where companies.id = customer_addresses.company_id
      and companies.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.companies
    where companies.id = customer_addresses.company_id
      and companies.owner_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('customer-avatars', 'customer-avatars', false)
on conflict (id) do nothing;

create policy "Customer avatars read"
on storage.objects
for select
using (
  bucket_id = 'customer-avatars'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
);

create policy "Customer avatars insert"
on storage.objects
for insert
with check (
  bucket_id = 'customer-avatars'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
);

create policy "Customer avatars update"
on storage.objects
for update
using (
  bucket_id = 'customer-avatars'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
)
with check (
  bucket_id = 'customer-avatars'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and companies.owner_id = auth.uid()
  )
);
