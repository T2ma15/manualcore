-- ============================================================
-- ManualCore -- Migracion 0006: arreglar codificacion de nombres
-- Los acentos/raya larga se corrompieron al pegar el seed (mojibake).
-- Se reescriben con escapes Unicode (ASCII puro: \uXXXX) para que
-- ningun copiar/pegar los vuelva a danar.
-- ============================================================

update public.document_templates set name_es = E'SOP — Manufactura'    where code = 'sop_mfg';
update public.document_templates set name_es = E'SOP — Administrativo'  where code = 'sop_admin';
update public.document_templates set name_es = E'Análisis de Riesgos'  where code = 'risk_analysis';
update public.document_templates set name_es = E'Política de Calidad'  where code = 'quality_policy';
update public.document_templates set name_es = 'Flujograma de Proceso'       where code = 'flowchart';
update public.document_templates set name_es = 'Objetivos de Calidad'        where code = 'quality_objectives';
update public.document_templates set name_es = 'Alcance del SGC'             where code = 'qms_scope';
update public.document_templates set name_es = 'Lista Maestra de Documentos' where code = 'master_list';

-- Verificar (deben verse con acentos correctos)
select code, name_es from public.document_templates order by code;
