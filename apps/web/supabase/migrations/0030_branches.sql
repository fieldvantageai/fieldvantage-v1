-- ============================================================
-- 0030_branches.sql
-- Adiciona suporte a filiais (branches) ao modelo existente.
-- branch_id é NULL por padrão em todos os lugares — empresas
-- sem filiais não sofrem nenhum impacto.
-- ============================================================

-- ── 1. Tabela branches ──────────────────────────────────────

create table if not exists public.branches (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  email         text null,
  phone         text null,
  address_line1 text null,
  address_line2 text null,
  city          text null,
  state         text null,
  zip_code      text null,
  country       text null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists branches_company_idx on public.branches(company_id);

drop trigger if exists set_timestamp_branches on public.branches;
create trigger set_timestamp_branches
  before update on public.branches
  for each row execute function public.set_updated_at();

-- ── 2. branch_id em company_memberships ─────────────────────

alter table public.company_memberships
  add column if not exists branch_id uuid null references public.branches(id) on delete set null;

create index if not exists company_memberships_branch_idx
  on public.company_memberships(branch_id)
  where branch_id is not null;

-- ── 3. branch_id em jobs ────────────────────────────────────

alter table public.jobs
  add column if not exists branch_id uuid null references public.branches(id) on delete set null;

create index if not exists jobs_branch_idx
  on public.jobs(branch_id)
  where branch_id is not null;

-- ── 4. branch_id em invites ─────────────────────────────────

alter table public.invites
  add column if not exists branch_id uuid null references public.branches(id) on delete set null;

-- ── 5. RLS em branches ──────────────────────────────────────

alter table public.branches enable row level security;

-- Qualquer membro da empresa ve as filiais
create policy "Members can view branches"
  on public.branches
  for select
  using (public.has_active_membership(company_id));

-- Apenas owner/admin sem branch (HQ) gerencia filiais
create policy "HQ admins can manage branches"
  on public.branches
  for all
  using (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = branches.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and m.branch_id is null
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = branches.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and m.branch_id is null
    )
  );

-- ── 6. Helper get_membership_context ────────────────────────
-- Retorna (role, branch_id) da membership ativa do usuário.
-- Substitui o padrão de chamar is_company_admin + branch_id separados.

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'membership_context'
      and n.nspname = 'public'
  ) then
    create type public.membership_context as (
      role      text,
      branch_id uuid
    );
  end if;
end $$;

create or replace function public.get_membership_context(company_uuid uuid)
returns public.membership_context
language sql
security definer
stable
set search_path = public
as $$
  select row(m.role, m.branch_id)::public.membership_context
  from public.company_memberships m
  where m.user_id = auth.uid()
    and m.company_id = company_uuid
    and m.status = 'active'
  limit 1;
$$;

create or replace function public.is_membership_assigned_to_job(
  job_uuid uuid,
  membership_uuid uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.job_assignments ja
    where ja.job_id = job_uuid
      and ja.membership_id = membership_uuid
  );
$$;

grant execute on function public.is_membership_assigned_to_job(uuid, uuid) to authenticated;

-- ── 7. RLS em jobs – reescreve as policies existentes ───────
-- As policies existentes usam has_active_membership (permissivas demais).
-- Substituímos por policies que respeitam role + branch.

drop policy if exists "Members can view jobs" on public.jobs;
drop policy if exists "Members can manage jobs" on public.jobs;

-- SELECT: lógica role × branch (4 cenários)
create policy "Jobs select by role and branch"
  on public.jobs
  for select
  using (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and (
          case
            -- owner/admin sem branch → vê tudo
            when m.role in ('owner', 'admin') and m.branch_id is null then true
            -- owner/admin de filial → vê apenas jobs da filial
            when m.role in ('owner', 'admin') and m.branch_id is not null
              then jobs.branch_id = m.branch_id
            -- member volante → só jobs atribuídos a ele (qualquer filial)
            when m.role = 'member' and m.branch_id is null
              then public.is_membership_assigned_to_job(jobs.id, m.id)
            -- member fixo → só jobs atribuídos a ele E da sua filial
            when m.role = 'member' and m.branch_id is not null
              then jobs.branch_id = m.branch_id
                and public.is_membership_assigned_to_job(jobs.id, m.id)
            else false
          end
        )
    )
  );

-- INSERT/UPDATE/DELETE: apenas admins, respeitando branch
create policy "Jobs write by role and branch"
  on public.jobs
  for all
  using (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and (
          m.branch_id is null
          or m.branch_id = jobs.branch_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and (
          m.branch_id is null
          or m.branch_id = jobs.branch_id
        )
    )
  );

-- ── 8. RLS em company_memberships – visibilidade por branch ─

drop policy if exists "Members can view company memberships by company" on public.company_memberships;
drop policy if exists "Admins can view company memberships" on public.company_memberships;
drop policy if exists "Members can view own memberships" on public.company_memberships;
drop policy if exists "Memberships select by branch" on public.company_memberships;

-- Função auxiliar SECURITY DEFINER para evitar recursão infinita na policy RLS
-- (a subquery na própria tabela causaria infinite recursion sem o SECURITY DEFINER)
create or replace function public.viewer_can_see_membership(
  target_company_id uuid,
  target_branch_id uuid
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships m
    where m.user_id = auth.uid()
      and m.company_id = target_company_id
      and m.status = 'active'
      and (
        m.branch_id is null
        or m.branch_id = target_branch_id
        or target_branch_id is null
      )
  );
$$;

grant execute on function public.viewer_can_see_membership(uuid, uuid) to authenticated;

-- SELECT: membros veem colegas da mesma filial (ou todos se HQ)
create policy "Memberships select by branch"
  on public.company_memberships
  for select
  using (
    -- Pode ver a própria membership sempre
    user_id = auth.uid()
    -- Ou se o viewer tem acesso à filial do target (via função para evitar recursão)
    or public.viewer_can_see_membership(company_id, branch_id)
  );

-- ── 9. RLS em invites – restringe branch admin ──────────────

drop policy if exists "Admins can manage invites" on public.invites;

create policy "Admins can manage invites by branch"
  on public.invites
  for all
  using (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = invites.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and (
          m.branch_id is null
          or m.branch_id = invites.branch_id
        )
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = invites.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and (
          m.branch_id is null
          or m.branch_id = invites.branch_id
        )
    )
  );
