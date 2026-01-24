alter table if exists public.companies
  add column if not exists team_size text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'companies_team_size_check'
  ) then
    alter table public.companies
      add constraint companies_team_size_check
      check (team_size in ('owner_operator', '2_5', '6_10', '11_plus'));
  end if;
end $$;
