-- ============================================================
-- ManualCore V0 — Migración 0003: seeds del catálogo de templates
-- Decisión de producto: sop_mfg y sop_admin son templates DISTINTOS
-- (no label-switching). Bilingüe: name_es / name_en.
-- norm_version se actualizará a '9001:2026' cuando se publique (~sep 2026).
-- ============================================================

insert into public.document_templates
  (code, doc_type, name_es, name_en, output_format, norm_version) values
  ('sop_mfg',            'sop_mfg',            'SOP — Manufactura',                'SOP — Manufacturing',           'docx',     '9001:2015'),
  ('sop_admin',          'sop_admin',          'SOP — Administrativo',             'SOP — Administrative',          'docx',     '9001:2015'),
  ('flowchart',          'flowchart',          'Flujograma de Proceso',            'Process Flowchart',             'html_svg', '9001:2015'),
  ('quality_policy',     'quality_policy',     'Política de Calidad',              'Quality Policy',                'docx',     '9001:2015'),
  ('quality_objectives', 'quality_objectives', 'Objetivos de Calidad',             'Quality Objectives',            'docx',     '9001:2015'),
  ('qms_scope',          'qms_scope',          'Alcance del SGC',                  'QMS Scope',                     'docx',     '9001:2015'),
  ('master_list',        'master_list',        'Lista Maestra de Documentos',      'Master Document List',          'xlsx',     '9001:2015'),
  ('risk_analysis',      'risk_analysis',      'Análisis de Riesgos',              'Risk Analysis',                 'xlsx',     '9001:2015');

-- ============================================================
-- Vista: Lista Maestra de Documentos
-- Lo primero que pide un auditor en la reunión de apertura.
-- ============================================================

create or replace view public.master_document_list
with (security_invoker = true) as
select
  d.tenant_id,
  d.doc_number                                   as codigo,
  d.title                                        as titulo,
  t.name_es                                      as tipo,
  'REV' || lpad(d.revision_number::text, 2, '0') as revision,
  d.status                                       as estado,
  uo.full_name                                   as elaboro,
  ua.full_name                                   as aprobo,
  d.effective_date                               as fecha_vigencia,
  d.review_due                                   as proxima_revision,
  (d.review_due is not null and d.review_due < current_date
   and d.status in ('approved','released'))      as vencido
from public.documents d
join public.document_templates t on t.id = d.template_id
left join public.revisions r
  on r.document_id = d.id and r.rev_number = d.revision_number
left join public.ownership o
  on o.document_id = d.id and o.revision_id = r.id
left join public.users uo on uo.id = o.owner_id
left join public.users ua on ua.id = o.approver_id
where d.status <> 'obsolete';
