-- ============================================================
-- ManualCore V0 — Migración 0002: funciones, triggers y RLS
-- ============================================================

-- ---------- HELPERS ----------

-- Tenant del usuario logueado (vía Supabase Auth)
create or replace function public.current_tenant_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select tenant_id from public.users
  where auth_user_id = auth.uid() and is_active
  limit 1
$$;

create or replace function public.is_platform_owner()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'platform_owner' from public.users
     where auth_user_id = auth.uid() and is_active limit 1),
    false)
$$;

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'tenants','users','sessions','nodes','operations','materials','steps',
    'product_specs','specs_5m','risks','brain_extractions','documents','ownership'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------- NUMERACIÓN ATÓMICA [DEPT]-[SECC][####] ----------
-- Concurrencia segura: el UPSERT incrementa y devuelve en una transacción.

create or replace function public.next_doc_number(
  p_tenant uuid, p_dept text, p_secc text)
returns text
language plpgsql security definer
set search_path = public
as $$
declare v_seq integer;
begin
  insert into public.doc_number_counters (tenant_id, dept_code, section_code, last_seq)
  values (p_tenant, p_dept, p_secc, 1)
  on conflict (tenant_id, dept_code, section_code)
  do update set last_seq = doc_number_counters.last_seq + 1
  returning last_seq into v_seq;
  return p_dept || '-' || p_secc || lpad(v_seq::text, 4, '0');
end $$;

-- ---------- STATE MACHINE DE DOCUMENTOS ----------
-- Transiciones válidas (incluye rechazo under_review→draft):
--   draft→under_review, under_review→draft, under_review→approved,
--   approved→released, approved→obsolete, released→obsolete

create or replace function public.enforce_document_transitions()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft'        and new.status = 'under_review') or
      (old.status = 'under_review' and new.status in ('draft','approved')) or
      (old.status = 'approved'     and new.status in ('released','obsolete')) or
      (old.status = 'released'     and new.status = 'obsolete')
    ) then
      raise exception 'Transición de estado inválida: % → %', old.status, new.status;
    end if;

    -- review_due obligatorio para entrar a revisión (regla no-negociable)
    if new.status = 'under_review' and new.review_due is null then
      raise exception 'review_due es obligatorio para pasar a Under Review';
    end if;

    if new.status = 'approved' then
      if new.review_due is null then
        raise exception 'review_due es obligatorio para aprobar';
      end if;
      new.approved_at := now();
      if new.effective_date is null then
        new.effective_date := current_date;
      end if;
    end if;
  end if;

  -- doc_number y revision_number son system-managed: nadie los cambia a mano
  if old.doc_number is not null and new.doc_number is distinct from old.doc_number then
    raise exception 'doc_number es generado por el sistema y no puede modificarse';
  end if;

  return new;
end $$;

create trigger documents_transitions
before update on public.documents
for each row execute function public.enforce_document_transitions();

-- ---------- AUDIT LOG INMUTABLE (mecanismo, no convención) ----------

create or replace function public.audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log es inmutable: UPDATE/DELETE prohibidos';
end $$;

create trigger audit_log_no_update_delete
before update or delete on public.audit_log
for each row execute function public.audit_log_immutable();

revoke update, delete on public.audit_log from anon, authenticated;
-- Nota: service_role bypasea RLS pero el trigger SÍ lo detiene.

-- Auditar cambios de estado de documentos automáticamente
create or replace function public.audit_document_status()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into public.audit_log
      (tenant_id, actor_id, actor_type, event_type, table_name, record_id, old_value, new_value)
    values
      (new.tenant_id,
       (select id from public.users where auth_user_id = auth.uid() limit 1),
       'user', 'status_change', 'documents', new.id,
       jsonb_build_object('status', old.status),
       jsonb_build_object('status', new.status, 'doc_number', new.doc_number));
  end if;
  return new;
end $$;

create trigger documents_audit_status
after update on public.documents
for each row execute function public.audit_document_status();

-- ---------- ROW LEVEL SECURITY ----------

-- Tablas con tenant_id: aislamiento uniforme
do $$
declare t text;
begin
  foreach t in array array[
    'users','departments','doc_number_counters','sessions','nodes','operations',
    'materials','steps','product_specs','specs_5m','risks','session_inputs',
    'brain_extractions','llm_calls','chat_messages','documents','revisions',
    'ownership','print_events','access_grants','generation_jobs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated
       using (tenant_id = public.current_tenant_id() or public.is_platform_owner())
       with check (tenant_id = public.current_tenant_id() or public.is_platform_owner())',
      t);
  end loop;
end $$;

-- tenants: cada quien ve su propia empresa; platform_owner ve todas
alter table public.tenants enable row level security;
create policy tenant_self on public.tenants for all to authenticated
  using (id = public.current_tenant_id() or public.is_platform_owner())
  with check (id = public.current_tenant_id() or public.is_platform_owner());

-- document_templates: catálogo global de solo lectura
alter table public.document_templates enable row level security;
create policy templates_read on public.document_templates for select
  to authenticated using (true);
create policy templates_admin on public.document_templates for all
  to authenticated using (public.is_platform_owner())
  with check (public.is_platform_owner());

-- audit_log: INSERT y SELECT solamente (sin policies de update/delete + trigger)
alter table public.audit_log enable row level security;
create policy audit_select on public.audit_log for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_platform_owner());
create policy audit_insert on public.audit_log for insert to authenticated
  with check (tenant_id = public.current_tenant_id() or public.is_platform_owner());
