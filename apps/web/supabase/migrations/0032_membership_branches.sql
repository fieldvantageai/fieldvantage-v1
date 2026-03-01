-- ============================================================
-- 0032_membership_branches.sql
-- Suporte a múltiplas filiais por colaborador (N:N)
-- membership_branches é a fonte de verdade; company_memberships.branch_id
-- permanece como "branch primária" para compatibilidade com código legado.
-- ============================================================

-- ── 1. Tabela de associação N:N ──────────────────────────────

create table if not exists public.membership_branches (
  membership_id uuid not null references public.company_memberships(id) on delete cascade,
  branch_id     uuid not null references public.branches(id) on delete cascade,
  primary key (membership_id, branch_id)
);

create index if not exists membership_branches_membership_idx on public.membership_branches(membership_id);
create index if not exists membership_branches_branch_idx     on public.membership_branches(branch_id);

-- ── 2. Coluna branch_ids em invites (convites multi-filial) ──

alter table public.invites
  add column if not exists branch_ids uuid[] null;

-- ── 3. Backfill: copiar branch_id existente para membership_branches

insert into public.membership_branches (membership_id, branch_id)
select id, branch_id
from public.company_memberships
where branch_id is not null
on conflict do nothing;

-- ── 4. RLS em membership_branches ────────────────────────────

alter table public.membership_branches enable row level security;

-- Usuários autenticados com membership ativa na empresa veem os vínculos
create policy "Company members can view membership_branches"
  on public.membership_branches for select
  using (
    exists (
      select 1 from public.company_memberships m
      join public.branches b on b.id = membership_branches.branch_id
      where m.id = membership_branches.membership_id
        and b.company_id = m.company_id
        and public.has_active_membership(m.company_id)
    )
  );

-- ── 5. Funções auxiliares SECURITY DEFINER ────────────────────

-- Retorna true se o usuário tem acesso HQ na empresa
-- (sem branch_id em company_memberships E sem entradas em membership_branches)
create or replace function public.user_is_hq(company_uuid uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships m
    where m.user_id = auth.uid()
      and m.company_id = company_uuid
      and m.status = 'active'
      and m.branch_id is null
      and not exists (
        select 1 from public.membership_branches mb where mb.membership_id = m.id
      )
  );
$$;

grant execute on function public.user_is_hq(uuid) to authenticated;

-- Retorna true se o usuário pode acessar uma filial específica
create or replace function public.user_can_access_branch(company_uuid uuid, target_branch_id uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships m
    where m.user_id = auth.uid()
      and m.company_id = company_uuid
      and m.status = 'active'
      and (
        -- Multi-filial: tem entrada explícita em membership_branches
        exists (
          select 1 from public.membership_branches mb
          where mb.membership_id = m.id and mb.branch_id = target_branch_id
        )
        or
        -- Legado single-branch: tem branch_id e não tem membership_branches
        (
          m.branch_id = target_branch_id
          and not exists (
            select 1 from public.membership_branches mb where mb.membership_id = m.id
          )
        )
      )
  );
$$;

grant execute on function public.user_can_access_branch(uuid, uuid) to authenticated;

-- ── 6. Atualizar viewer_can_see_membership para multi-filial ──

create or replace function public.viewer_can_see_membership(
  target_company_id uuid,
  target_branch_id  uuid
)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships viewer_m
    where viewer_m.user_id = auth.uid()
      and viewer_m.company_id = target_company_id
      and viewer_m.status = 'active'
      and (
        -- HQ: sem branch_id e sem entradas em membership_branches
        (
          viewer_m.branch_id is null
          and not exists (
            select 1 from public.membership_branches mb where mb.membership_id = viewer_m.id
          )
        )
        -- Membros sem filial (volantes) são visíveis a todos
        or target_branch_id is null
        -- Viewer multi-filial: target está em uma das suas filiais
        or exists (
          select 1 from public.membership_branches mb
          where mb.membership_id = viewer_m.id and mb.branch_id = target_branch_id
        )
        -- Viewer legado single-branch: target é a mesma filial
        or (
          viewer_m.branch_id = target_branch_id
          and not exists (
            select 1 from public.membership_branches mb where mb.membership_id = viewer_m.id
          )
        )
      )
  );
$$;

-- ── 7. Atualizar get_my_memberships() para retornar branch_ids ─

drop function if exists public.get_my_memberships();

create function public.get_my_memberships()
returns table (
  company_id uuid,
  role       text,
  status     text,
  branch_id  uuid,
  branch_ids uuid[]
)
language sql security definer stable set search_path = public
as $$
  select
    m.company_id,
    m.role,
    m.status,
    m.branch_id,
    coalesce(
      (
        select array_agg(mb.branch_id order by mb.branch_id)
        from public.membership_branches mb
        where mb.membership_id = m.id
      ),
      array[]::uuid[]
    ) as branch_ids
  from public.company_memberships m
  where m.user_id = auth.uid()
    and m.status = 'active';
$$;

grant execute on function public.get_my_memberships() to authenticated;

-- ── 8. Reescrever policies de jobs ───────────────────────────

drop policy if exists "Jobs select by role and branch" on public.jobs;
drop policy if exists "Jobs write by role and branch"  on public.jobs;

create policy "Jobs select by role and branch"
  on public.jobs for select
  using (
    -- HQ vê tudo
    public.user_is_hq(jobs.company_id)
    or
    -- Usuários com acesso à filial do job
    (
      jobs.branch_id is not null
      and public.user_can_access_branch(jobs.company_id, jobs.branch_id)
      and exists (
        select 1 from public.company_memberships m
        where m.user_id = auth.uid()
          and m.company_id = jobs.company_id
          and m.status = 'active'
          and (
            m.role in ('owner', 'admin')
            or public.is_membership_assigned_to_job(jobs.id, m.id)
          )
      )
    )
  );

create policy "Jobs write by role and branch"
  on public.jobs for all
  using (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and (
          public.user_is_hq(jobs.company_id)
          or (
            jobs.branch_id is not null
            and public.user_can_access_branch(jobs.company_id, jobs.branch_id)
          )
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
          public.user_is_hq(jobs.company_id)
          or (
            jobs.branch_id is not null
            and public.user_can_access_branch(jobs.company_id, jobs.branch_id)
          )
        )
    )
  );

-- ── 9. Reescrever policy de invites ──────────────────────────

drop policy if exists "Admins can manage invites by branch" on public.invites;

-- Qualquer admin/owner na empresa pode gerenciar invites.
-- O guard de filial é aplicado na camada de API (app/api/employees/route.ts).
create policy "Admins can manage invites"
  on public.invites for all
  using (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = invites.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = invites.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    )
  );
