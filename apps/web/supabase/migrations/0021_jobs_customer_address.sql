alter table if exists public.jobs
  add column if not exists customer_address_id uuid null
    references public.customer_addresses(id) on delete set null;

create index if not exists jobs_customer_address_idx
  on public.jobs(customer_address_id);
