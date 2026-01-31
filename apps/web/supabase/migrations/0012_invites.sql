alter table if exists public.employees
  add column if not exists user_id uuid null,
  add column if not exists invitation_status text not null default 'pending';

alter table if exists public.employees
  add column if not exists is_active boolean not null default true;

alter table if exists public.employees
  alter column email drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_invitation_status_check'
  ) then
    alter table public.employees
      add constraint employees_invitation_status_check
      check (invitation_status in ('pending', 'accepted', 'revoked', 'expired'));
  end if;
end $$;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  status text not null default 'pending',
  sent_at timestamptz null,
  accepted_at timestamptz null,
  revoked_at timestamptz null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'invites_status_check'
  ) then
    alter table public.invites
      add constraint invites_status_check
      check (status in ('pending', 'accepted', 'revoked', 'expired'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'invites_company_id_idx'
  ) then
    create index invites_company_id_idx on public.invites (company_id);
  end if;
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'invites_employee_id_idx'
  ) then
    create index invites_employee_id_idx on public.invites (employee_id);
  end if;
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'invites_token_hash_idx'
  ) then
    create index invites_token_hash_idx on public.invites (token_hash);
  end if;
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'invites_employee_id_pending_uniq'
  ) then
    create unique index invites_employee_id_pending_uniq
      on public.invites (employee_id)
      where status = 'pending';
  end if;
end $$;

create or replace function public.expire_invites()
returns void
language sql
as $$
  update public.invites
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
$$;
