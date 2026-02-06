-- 1) Deduplicate employees by user_id
with canonical as (
  select user_id, min(id::text)::uuid as canonical_id
  from public.employees
  where user_id is not null
  group by user_id
  having count(*) > 1
),
dup as (
  select e.id, c.canonical_id
  from public.employees e
  join canonical c on e.user_id = c.user_id
  where e.id <> c.canonical_id
)
update public.job_assignments
set employee_id = dup.canonical_id
from dup
where job_assignments.employee_id = dup.id;

with canonical as (
  select user_id, min(id::text)::uuid as canonical_id
  from public.employees
  where user_id is not null
  group by user_id
  having count(*) > 1
),
dup as (
  select e.id, c.canonical_id
  from public.employees e
  join canonical c on e.user_id = c.user_id
  where e.id <> c.canonical_id
)
update public.invites
set employee_id = dup.canonical_id
from dup
where invites.employee_id = dup.id;

with canonical as (
  select user_id, min(id::text)::uuid as canonical_id
  from public.employees
  where user_id is not null
  group by user_id
  having count(*) > 1
),
dup as (
  select e.id
  from public.employees e
  join canonical c on e.user_id = c.user_id
  where e.id <> c.canonical_id
)
delete from public.employees
using dup
where employees.id = dup.id;

-- 2) Deduplicate employees by email (case-insensitive)
with canonical as (
  select lower(email) as email_key, min(id::text)::uuid as canonical_id
  from public.employees
  where email is not null
  group by lower(email)
  having count(*) > 1
),
dup as (
  select e.id, c.canonical_id
  from public.employees e
  join canonical c on lower(e.email) = c.email_key
  where e.id <> c.canonical_id
)
update public.job_assignments
set employee_id = dup.canonical_id
from dup
where job_assignments.employee_id = dup.id;

with canonical as (
  select lower(email) as email_key, min(id::text)::uuid as canonical_id
  from public.employees
  where email is not null
  group by lower(email)
  having count(*) > 1
),
dup as (
  select e.id, c.canonical_id
  from public.employees e
  join canonical c on lower(e.email) = c.email_key
  where e.id <> c.canonical_id
)
update public.invites
set employee_id = dup.canonical_id
from dup
where invites.employee_id = dup.id;

with canonical as (
  select lower(email) as email_key, min(id::text)::uuid as canonical_id
  from public.employees
  where email is not null
  group by lower(email)
  having count(*) > 1
),
dup as (
  select e.id
  from public.employees e
  join canonical c on lower(e.email) = c.email_key
  where e.id <> c.canonical_id
)
delete from public.employees
using dup
where employees.id = dup.id;

-- 3) Backfill memberships from owners, employees, and accepted invites
insert into public.company_memberships (company_id, user_id, role, status)
select companies.id, companies.owner_id, 'owner', 'active'
from public.companies
on conflict (company_id, user_id)
do update set status = 'active', role = excluded.role;

insert into public.company_memberships (company_id, user_id, role, status)
select
  employees.company_id,
  employees.user_id,
  case
    when employees.role = 'owner' then 'owner'
    when employees.role = 'admin' then 'admin'
    else 'member'
  end,
  case when employees.is_active then 'active' else 'inactive' end
from public.employees
where employees.user_id is not null
  and employees.company_id is not null
on conflict (company_id, user_id)
do update set status = excluded.status, role = excluded.role;

insert into public.company_memberships (company_id, user_id, role, status)
select
  invites.company_id,
  employees.user_id,
  case
    when invites.role = 'owner' then 'owner'
    when invites.role = 'admin' then 'admin'
    else 'member'
  end,
  'active'
from public.invites
join public.employees on employees.id = invites.employee_id
where invites.status = 'accepted'
  and employees.user_id is not null
on conflict (company_id, user_id)
do update set status = 'active', role = excluded.role;

-- 4) Create unique indexes after cleanup
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'employees_user_id_uniq'
  ) then
    create unique index employees_user_id_uniq
      on public.employees (user_id)
      where user_id is not null;
  end if;
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'employees_email_uniq'
  ) then
    create unique index employees_email_uniq
      on public.employees (lower(email))
      where email is not null;
  end if;
end $$;
