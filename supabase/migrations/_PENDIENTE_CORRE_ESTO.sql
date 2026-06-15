-- ============================================================
-- ManualCore -- CORRE ESTE ARCHIVO UNA VEZ en Supabase (SQL Editor).
-- Bundle idempotente de TODO lo pendiente: 0007..0011.
-- Si algo ya estaba aplicado, no pasa nada (usa IF NOT EXISTS / OR REPLACE).
-- ASCII a proposito para evitar problemas de acentos al copiar/pegar.
-- ============================================================

-- ---- 0007: plantilla Plan de Inspeccion de Calidad ----
insert into public.document_templates
  (code, doc_type, name_es, name_en, output_format, norm_version)
values
  ('inspection_plan', 'inspection_plan', 'Plan de Inspeccion de Calidad',
   'Quality Inspection Plan', 'xlsx', '9001:2015')
on conflict (code) do nothing;

-- ---- 0008: categoria en brain_extractions ----
alter table public.brain_extractions add column if not exists category text;

-- ---- 0009: aprobacion flexible + numeracion editable ----
alter table public.documents add column if not exists owner_name text;
alter table public.documents add column if not exists approver_name text;

create or replace function public.enforce_document_transitions()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft' and new.status in ('under_review','approved')) or
      (old.status = 'under_review' and new.status in ('draft','approved')) or
      (old.status = 'approved' and new.status in ('released','obsolete','draft')) or
      (old.status = 'released' and new.status in ('obsolete','draft'))
    ) then
      raise exception 'Transicion de estado invalida: % -> %', old.status, new.status;
    end if;

    if new.status in ('under_review','approved') and new.review_due is null then
      raise exception 'review_due es obligatorio para revisar o aprobar';
    end if;

    if new.status = 'approved' then
      if new.approved_at is null then new.approved_at := now(); end if;
      if new.effective_date is null then new.effective_date := current_date; end if;
    end if;
  end if;
  return new;
end $$;

-- ---- 0010: borrado suave + papelera ----
alter table public.documents add column if not exists deleted_at timestamptz;
create index if not exists documents_deleted_idx on public.documents(tenant_id, deleted_at);

-- ---- 0011: motor de relacion documental ----
alter table public.brain_extractions add column if not exists is_critical boolean not null default false;

create table if not exists public.document_relations (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id),
  from_document_id    uuid not null references public.documents(id) on delete cascade,
  to_document_id      uuid references public.documents(id) on delete set null,
  to_title            varchar(400) not null,
  to_code             varchar(50),
  rel_type            text not null default 'registro'
                      check (rel_type in ('registro','checklist','formato','instructivo',
                                          'sop','politica','analisis_riesgo','plan_inspeccion','otro')),
  relation            text,
  frequency           varchar(100),
  status              text not null default 'suggested'
                      check (status in ('existing','suggested','created')),
  needs_review        boolean not null default false,
  review_reason       text,
  review_confirmed_by uuid references public.users(id),
  review_confirmed_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists document_relations_tenant_idx on public.document_relations(tenant_id);
create index if not exists document_relations_from_idx   on public.document_relations(from_document_id);
create index if not exists document_relations_to_idx     on public.document_relations(to_document_id);
create index if not exists document_relations_review_idx on public.document_relations(tenant_id, needs_review);

drop trigger if exists document_relations_set_updated_at on public.document_relations;
create trigger document_relations_set_updated_at
  before update on public.document_relations
  for each row execute function public.set_updated_at();

alter table public.document_relations enable row level security;
drop policy if exists tenant_isolation on public.document_relations;
create policy tenant_isolation on public.document_relations for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_platform_owner())
  with check (tenant_id = public.current_tenant_id() or public.is_platform_owner());

create or replace function public.flag_related_on_revision()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if new.revision_number is distinct from old.revision_number then
    update public.document_relations
      set needs_review = true,
          review_reason = 'Cambio en ' || coalesce(new.doc_number, new.title)
                          || ' (REV' || lpad(new.revision_number::text, 2, '0') || ')',
          review_confirmed_by = null,
          review_confirmed_at = null,
          updated_at = now()
    where tenant_id = new.tenant_id
      and (to_document_id = new.id or from_document_id = new.id);
  end if;
  return new;
end $$;

drop trigger if exists documents_flag_relations on public.documents;
create trigger documents_flag_relations
  after update on public.documents
  for each row execute function public.flag_related_on_revision();

-- Listo. Revisa que no haya errores arriba.
select 'ManualCore: pendientes aplicados' as estado;
