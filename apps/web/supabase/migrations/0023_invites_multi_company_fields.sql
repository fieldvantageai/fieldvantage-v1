alter table if exists public.invites
  add column if not exists email text null,
  add column if not exists full_name text null,
  add column if not exists role text null,
  add column if not exists accepted_by uuid null references auth.users(id);

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'invites_token_hash_uniq'
  ) then
    create unique index invites_token_hash_uniq on public.invites (token_hash);
  end if;
end $$;
