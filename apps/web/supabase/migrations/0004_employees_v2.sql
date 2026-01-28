alter table if exists public.employees
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists avatar_url text null,
  add column if not exists job_title text null,
  add column if not exists notes text null,
  add column if not exists address_line1 text null,
  add column if not exists address_line2 text null,
  add column if not exists city text null,
  add column if not exists state text null,
  add column if not exists zip_code text null,
  add column if not exists country text not null default 'USA';

update public.employees
set
  first_name = coalesce(first_name, split_part(full_name, ' ', 1)),
  last_name = coalesce(
    last_name,
    nullif(trim(substring(full_name from position(' ' in full_name) + 1)), ''),
    split_part(full_name, ' ', 1)
  );

alter table public.employees
  alter column first_name set not null,
  alter column last_name set not null;
