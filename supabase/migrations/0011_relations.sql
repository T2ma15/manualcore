-- ============================================================
-- ManualCore -- Migracion 0011: motor de relacion documental
-- Matriz de referenciamiento + criticidad + control de cambios.
-- Idempotente (se puede correr varias veces sin romper nada).
-- ============================================================

-- 1) Criticidad en las extracciones: marca los puntos de control.
alter table public.brain_extractions
  add column if not exists is_critical boolean not null default false;

-- 2) Relaciones entre documentos (SOP <-> registro / checklist / formato / ...).
--    to_document_id es NULL mientras el relacionado no exista como documento.
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
  relation            text,            -- que se registra / como se relaciona
  frequency           varchar(100),    -- cada cuanto
  status              text not null default 'suggested'
                      check (status in ('existing','suggested','created')),
  needs_review        boolean not null default false,   -- control de cambios
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

-- updated_at automatico
drop trigger if exists document_relations_set_updated_at on public.document_relations;
create trigger document_relations_set_updated_at
  before update on public.document_relations
  for each row execute function public.set_updated_at();

-- RLS: aislamiento por tenant (mismo patron que el resto del esquema).
alter table public.document_relations enable row level security;
drop policy if exists tenant_isolation on public.document_relations;
create policy tenant_isolation on public.document_relations for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_platform_owner())
  with check (tenant_id = public.current_tenant_id() or public.is_platform_owner());

-- 3) Control de cambios: si un documento cambia de revision, sus relacionados
--    (en ambos sentidos) se marcan para revisar y se les borra la confirmacion.
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
