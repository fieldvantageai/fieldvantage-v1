create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timestamp_messages on public.messages;
create trigger set_timestamp_messages
before update on public.messages
for each row execute function public.set_updated_at();

alter table public.messages enable row level security;

create or replace function public.user_has_active_membership(
  company_uuid uuid,
  user_uuid uuid
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships
    where company_memberships.company_id = company_uuid
      and company_memberships.user_id = user_uuid
      and company_memberships.status = 'active'
  );
$$;

drop policy if exists "Members can view messages" on public.messages;
drop policy if exists "Members can insert messages" on public.messages;
drop policy if exists "Members can update messages" on public.messages;

create policy "Members can view messages"
on public.messages
for select
using (
  public.user_has_active_membership(company_id, auth.uid())
  and (sender_user_id = auth.uid() or recipient_user_id = auth.uid())
);

create policy "Members can insert messages"
on public.messages
for insert
with check (
  sender_user_id = auth.uid()
  and public.user_has_active_membership(company_id, auth.uid())
  and public.user_has_active_membership(company_id, recipient_user_id)
);

create policy "Members can update messages"
on public.messages
for update
using (
  recipient_user_id = auth.uid()
  and public.user_has_active_membership(company_id, auth.uid())
)
with check (
  recipient_user_id = auth.uid()
  and public.user_has_active_membership(company_id, auth.uid())
);

create index if not exists messages_company_id_idx
  on public.messages(company_id);
create index if not exists messages_sender_user_id_idx
  on public.messages(sender_user_id);
create index if not exists messages_recipient_user_id_idx
  on public.messages(recipient_user_id);
