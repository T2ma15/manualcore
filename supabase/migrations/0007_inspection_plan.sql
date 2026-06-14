-- ============================================================
-- ManualCore — Migración 0007: Plan de Inspección de Calidad
-- (especificaciones por producto). El nombre visible viene del
-- código (TEMPLATE_NAMES); aquí el name_es va en ASCII a propósito.
-- ============================================================

insert into public.document_templates
  (code, doc_type, name_es, name_en, output_format, norm_version)
values
  ('inspection_plan', 'inspection_plan', 'Plan de Inspeccion de Calidad', 'Quality Inspection Plan', 'xlsx', '9001:2015')
on conflict (code) do nothing;

select code, name_es, output_format from public.document_templates order by code;
