update public.employees
set
  user_id = auth.users.id,
  invitation_status = 'accepted'
from auth.users
where public.employees.user_id is null
  and public.employees.email is not null
  and lower(public.employees.email) = lower(auth.users.email);
