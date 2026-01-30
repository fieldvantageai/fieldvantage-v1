alter table if exists public.customer_addresses
  add column if not exists note text null;
