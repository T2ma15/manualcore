# ManualCore — Base de datos (Supabase)

**Esta carpeta es la fuente de verdad del schema.** El Excel de matrices
(`ManualCore_Database_Schema.xlsx`) queda como documento de visión; lo que
se construye es lo que está aquí.

## Cómo aplicar (esta noche, 10 minutos)

1. Abrir https://supabase.com/dashboard/project/iybgndufnrogdbkpbbrl
2. Menú izquierdo → **SQL Editor** → **New query**
3. Pegar y ejecutar **en orden**, un archivo a la vez:
   1. `migrations/0001_init.sql` — 23 tablas
   2. `migrations/0002_rls_triggers.sql` — seguridad multi-empresa (RLS), numeración atómica, state machine, audit inmutable
   3. `migrations/0003_seed_templates.sql` — catálogo de 8 templates + vista Lista Maestra
4. Verificar: **Table Editor** debe mostrar las tablas; correr los tests de abajo.

## Qué se corrigió vs el Excel (validación 11 jun 2026)

- `tenant_id` en TODAS las tablas + RLS uniforme (el Excel lo tenía en 6 de 32)
- `users.auth_user_id` → vínculo con Supabase Auth (sin esto RLS no funciona)
- `sop_admin` existe como template DISTINTO de `sop_mfg` (tabla `document_templates`)
- Numeración `[DEPT]-[SECC][####]` atómica (`next_doc_number()`) — sin duplicados bajo concurrencia
- `REV##` derivado de `revision_number` (no parte del doc_number)
- Firmas por revisión (`ownership.revision_id`) — re-aprobar no borra firmas anteriores
- Historial de revisiones NUNCA se purga (`retained` es solo display)
- `print_events.pdf_snapshot_url` — evidencia exacta de cada copia impresa
- `audit_log` inmutable por trigger + REVOKE (mecanismo, no convención)
- State machine con rechazo modelado (under_review→draft)
- `generation_jobs.idempotency_key` — reintentos de la API no duplican documentos
- `llm_calls` — costo de Claude API por tenant (el costo variable del negocio)
- Bilingüe: `tenants.locale`, `documents.language`, `name_es/name_en` (decisión: ES + EN)
- 5 estados se quedan, incluido `released` (decisión de producto)
- `norm_version` en templates — listo para ISO 9001:2026 (sep 2026)
- **Análisis de Riesgos en V0** (tabla `risks` + template `risk_analysis`) —
  formato matriz de riesgos; DISTINTO del PFMEA (AIAG-VDA), que queda en V1
- `documents.related_docs` — el brain detecta documentos mencionados en el input;
  si ya existen pregunta nombre/código, si no, los sugiere crear
- Fuera de V0 (diseño v1.1, no se crean): photos, conflicts, time_study, gantt,
  vsm, training_records, document_relationships, external_documents, pfmea

## Tests de las reglas no-negociables (pegar en SQL Editor tras aplicar)

```sql
-- 1. audit_log inmutable (debe FALLAR con "audit_log es inmutable")
insert into audit_log (tenant_id, event_type) 
  select id, 'test' from tenants limit 1;
update audit_log set event_type = 'hacked' where event_type = 'test';

-- 2. owner ≠ approver (debe FALLAR con violación de check)
-- (requiere un tenant/doc/revision/user de prueba; se prueba en la app)

-- 3. Numeración atómica (debe devolver PRD-MFG0001, PRD-MFG0002)
select next_doc_number(id, 'PRD', 'MFG') from tenants limit 1;
select next_doc_number(id, 'PRD', 'MFG') from tenants limit 1;

-- 4. Transición inválida (debe FALLAR: draft no puede ir directo a approved)
-- update documents set status = 'approved' where status = 'draft';
```

## Variables de entorno

Las llaves viven en Vercel (Production/Preview) y en `.env.local` (local).
Ver `.env.local` en la raíz del proyecto.
