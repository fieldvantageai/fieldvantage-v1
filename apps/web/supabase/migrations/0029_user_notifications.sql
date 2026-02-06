create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  entity_id uuid not null references public.invites(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table if exists public.user_notifications
  add column if not exists user_id uuid null,
  add column if not exists type text null,
  add column if not exists entity_id uuid null,
  add column if not exists company_id uuid null,
  add column if not exists read_at timestamptz null,
  add column if not exists created_at timestamptz null;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'user_notifications_unique_user_type_entity'
  ) then
    create unique index user_notifications_unique_user_type_entity
      on public.user_notifications (user_id, type, entity_id);
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'user_notifications_user_read_idx'
  ) then
    create index user_notifications_user_read_idx
      on public.user_notifications (user_id, read_at);
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'user_notifications_company_id_idx'
  ) then
    create index user_notifications_company_id_idx
      on public.user_notifications (company_id);
  end if;
end $$;

alter table if exists public.user_notifications enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notifications'
      and policyname = 'Users can view own notifications'
  ) then
    create policy "Users can view own notifications"
      on public.user_notifications
      for select
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_notifications'
      and policyname = 'Users can update own notifications'
  ) then
    create policy "Users can update own notifications"
      on public.user_notifications
      for update
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;
