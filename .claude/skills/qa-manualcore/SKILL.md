---
name: qa-manualcore
description: Inspector de calidad de ManualCore. Usar después de completar cada feature grande o antes de cada demo — corre la verificación end-to-end del V0 y reporta qué pasa y qué falla, sin que Tania tenga que probar a mano.
---

# QA ManualCore — verificación end-to-end

## Cómo ejecutar
1. Levantar la app local (`npm run dev`) o usar el preview de Vercel
2. Recorrer los pasos aplicables de la lista (saltar los de features aún no construidas)
3. Reportar en formato: ✅ pasa / ❌ falla (con error textual) / ⏭️ no aplica aún
4. Si algo falla: diagnosticar la causa ANTES de reportar, proponer el fix

## Checklist V0 (espejo del flujo de verificación del plan)

### Fundación
- [ ] Las migraciones corren limpias en un proyecto Supabase vacío
- [ ] audit_log rechaza UPDATE/DELETE (probar y esperar excepción)
- [ ] `next_doc_number()` devuelve secuencia sin saltos ni duplicados (2 llamadas seguidas)
- [ ] Transición inválida de estado es rechazada (draft→approved directo debe fallar)
- [ ] RLS: usuario del tenant A no ve NINGUNA fila del tenant B (probar con 2 usuarios)

### Flujo de usuario
- [ ] Registro → crea tenant + usuario admin → llega a /app
- [ ] Card flow: industria → template → nuevo → crea session + draft
- [ ] Pegar texto de proceso real → brain extrae y muestra Confirmations verdes
- [ ] Brain pregunta faltantes (Questions ámbar) — UNA a la vez, con action buttons
- [ ] Criticidades NUNCA omitidas: si el input menciona seguridad/specs sin valores, el brain pregunta
- [ ] Documento relacionado mencionado → brain pregunta "¿ya existe?" → guarda referencia o sugerencia
- [ ] Generar → DOCX descarga, formato corporativo del TENANT (ManualCore invisible)
- [ ] SOP Admin usa SU template (campos admin, sin 5M de manufactura)
- [ ] Análisis de riesgos: probabilidad × impacto calculado, matriz se genera
- [ ] Draft → Under Review exige review_due
- [ ] Approve asigna doc_number y revision REV00; owner=approver es rechazado
- [ ] Print → PDF con footer "Printed by [Nombre] | Copy # of # | fecha | doc# rev"
- [ ] print_event + audit_log registrados
- [ ] Lista Maestra muestra todos los docs con revisión vigente y vencidos en rojo
- [ ] Dashboard tenant: conteos por estado correctos
- [ ] Dashboard plataforma (/platform): solo accesible para platform_owner
- [ ] Idioma: tenant con locale 'en' ve UI y genera documentos en inglés

### Calidad de extracción (el core — probar con texto real)
Texto de prueba estándar: proceso de ensamble con riveteadora (fuerza 450N ±20),
3 operaciones, 2 materiales con SKU, 1 paso con EPP, 1 inspección.
- [ ] Extrae ≥70% de los campos correctamente
- [ ] No inventa datos que no están en el input
- [ ] Pregunta exactamente lo que falta (ni más, ni menos)

## Regla de oro
Type-check ≠ prueba funcional. Solo se marca terminado lo verificado en navegador.
