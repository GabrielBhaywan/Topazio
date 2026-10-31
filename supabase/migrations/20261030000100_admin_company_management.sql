-- Add restrictive SELECT policies so company users cannot query their own
-- profile or company while the company is blocked. Existing policies remain.
begin;

create policy companies_active_status_guard
on public.companies
as restrictive
for select
to authenticated
using (
  public.is_rumofalcao_admin()
  or (
    id = public.current_user_company_id()
    and status = 'active'
  )
);

create policy profiles_active_company_guard
on public.profiles
as restrictive
for select
to authenticated
using (
  public.is_rumofalcao_admin()
  or (
    id = (select auth.uid())
    and role = 'rumofalcao_admin'
    and company_id is null
  )
  or (
    id = (select auth.uid())
    and role = 'company_user'
    and company_id = public.current_user_company_id()
    and exists (
      select 1
      from public.companies as company
      where company.id = profiles.company_id
        and company.status = 'active'
    )
  )
);

-- One database transaction creates both public records. Only service_role may call it.
create or replace function public.admin_create_company_for_user(
  p_name text,
  p_full_name text,
  p_user_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  new_company_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_user_id is null
    or length(btrim(coalesce(p_name, ''))) < 2
    or length(btrim(coalesce(p_name, ''))) > 120
    or length(btrim(coalesce(p_full_name, ''))) < 2
    or length(btrim(coalesce(p_full_name, ''))) > 120
  then
    raise exception 'invalid input' using errcode = '22023';
  end if;

  insert into public.companies (name, status, created_at, updated_at)
  values (btrim(p_name), 'active', now(), now())
  returning id into new_company_id;

  insert into public.profiles (
    id,
    company_id,
    full_name,
    role,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    new_company_id,
    btrim(p_full_name),
    'company_user',
    now(),
    now()
  );

  return new_company_id;
end;
$function$;

revoke all on function public.admin_create_company_for_user(text, text, uuid)
from public, anon, authenticated;
grant execute on function public.admin_create_company_for_user(text, text, uuid)
to service_role;

commit;
