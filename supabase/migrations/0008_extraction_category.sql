-- ============================================================
-- ManualCore — Migración 0008: categoría en brain_extractions
-- Permite agrupar el contenido en secciones al generar el documento.
-- ============================================================

alter table public.brain_extractions
  add column if not exists category text;
