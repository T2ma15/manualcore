-- ============================================================
-- ManualCore V0 — Migración 0004: registro automático
-- Cuando alguien se registra (auth.users), se crea su empresa
-- (tenant) y su usuario admin automáticamente. Atómico y limpio
-- para RLS — la app nunca necesita la llave secreta para esto.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_company   text;
  v_name      text;
  v_slug      text;
begin
  v_company := coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), 'Mi Empresa');
  v_name    := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));

  v_slug := lower(regexp_replace(v_company, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then v_slug := 'empresa'; end if;
  -- sufijo corto para garantizar unicidad
  v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.tenants (name, slug, locale)
    values (v_company, v_slug, 'es')
    returning id into v_tenant_id;

  insert into public.users (tenant_id, auth_user_id, email, full_name, role)
    values (v_tenant_id, new.id, new.email, v_name, 'admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
