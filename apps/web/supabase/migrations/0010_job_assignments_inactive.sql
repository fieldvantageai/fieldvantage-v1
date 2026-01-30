alter table if exists public.job_assignments
  add column if not exists allow_inactive boolean not null default false;

create or replace function public.enforce_active_employee_assignment()
returns trigger as $$
declare
  employee_active boolean;
  employee_company uuid;
  job_company uuid;
  is_owner boolean;
begin
  select is_active, company_id
    into employee_active, employee_company
  from public.employees
  where id = new.employee_id;

  select company_id into job_company
  from public.jobs
  where id = new.job_id;

  if employee_company is null or job_company is null or employee_company <> job_company then
    raise exception 'EMPLOYEE_COMPANY_MISMATCH';
  end if;

  if employee_active = false then
    if new.allow_inactive = true then
      select exists (
        select 1
        from public.companies
        where companies.id = job_company
          and companies.owner_id = auth.uid()
      ) into is_owner;
      if not is_owner then
        raise exception 'EMPLOYEE_INACTIVE';
      end if;
    else
      raise exception 'EMPLOYEE_INACTIVE';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists enforce_active_employee_assignment on public.job_assignments;
create trigger enforce_active_employee_assignment
before insert on public.job_assignments
for each row execute function public.enforce_active_employee_assignment();
