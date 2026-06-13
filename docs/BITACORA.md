# Bitácora de ManualCore

## 11 jun 2026 (día) — Validación + preparación
- ✅ Validación profunda de MVP y matrices (7 análisis; informe en `docs/analysis/VEREDICTO-MVP-2026-06-11.md`)
- ✅ Decisiones de Tania: bilingüe ES/EN · Released + dashboard plataforma SE QUEDAN · Lista Maestra + política/objetivos/alcance en V0 · pilotos máx 7 días → carta $49/mes
- ✅ Análisis de Riesgos movido a V0 (≠ PFMEA, que va en V1); related_docs con flujo "¿ya existe?"
- ✅ Posicionamiento registrado: NO-QMS; usuarios = PyMEs LatAm (cualquier negocio) + consultores de todo tipo; expansión = idiomas; módulo de entrenamiento por documento (video + examen + registro) en visión V1
- ✅ ISO 9001:2026 verificada (sale ~sep 2026, transición a 2029, cláusula 7.5 casi igual → matrices agnósticas; `norm_version` en templates)
- ✅ Migraciones SQL listas (`supabase/migrations/0001-0003`): 23 tablas, RLS, triggers, 8 templates bilingües, vista Lista Maestra
- ✅ 5 skills creados: manualcore-dev, demo-dominicana, qa-manualcore, sesion-diaria, copy-manualcore
- Pendiente de Tania (día): DNS manualcore.com → Vercel; Zoho para los 3 dominios

## 11 jun 2026 (tarde) — Materiales comerciales
- ✅ Gantt de gestión del proyecto (`docs/gestion/ManualCore_Gantt_Proyecto.html`) — verificado en navegador
- ✅ Pitch de venta completo (`docs/ventas/PITCH.md`) — elevator, demo guion, objeciones, precios
- ✅ Canales de venta + secuencia 30 días (`docs/ventas/CANALES.md`)
- ✅ CRM en Excel (`docs/ventas/CRM-ManualCore.xlsx`) — 4 hojas, 12 prospectos verificados precargados
- ⏳ Investigación profunda de prospectos/ads falló por límite de sesión (reset 7:10pm DR) — RE-LANZAR esta noche

## 11 jun 2026 (noche) — Schema EN VIVO ✅
- ✅ Schema aplicado en Supabase vía un solo bloque combinado (`_ALL_IN_ONE.sql` = reset + 0001-0003). El intento inicial por archivo separado dio "relation tenants already exists" → se resolvió con reset limpio (`0000_reset.sql`) que dropea y recrea el schema public.
- ✅ Tests de reglas pasados EN VIVO: numeración atómica generó PRD-MFG0001/0002; audit_log rechazó el UPDATE con "audit_log es inmutable: UPDATE/DELETE prohibidos" (la prueba estrella); 8 templates bilingües confirmados.
- ✅ Aprendizaje de diseño confirmado: no se puede hard-delete un tenant con filas en audit_log (FK + inmutabilidad) → soft-delete (is_active=false) es el patrón correcto, ya alineado con la spec.
- ✅ Investigación GTM completada: 15 prospectos verificados con contactos reales (`docs/ventas/PROSPECTOS.md`), CRM con 33 filas, pitch y canales. Incluye implementadores ERP (CANALES.md actualizado por Tania).
- ⏳ Pendiente: commit + push a GitHub (la app local aún no conoce el schema, pero el schema vive en Supabase).

**Día 2 se adelantó la misma noche del 11 (ver abajo).**

## 11-12 jun 2026 (madrugada) — DÍA 2 adelantado ✅
- ✅ Instalados `@supabase/supabase-js` y `@supabase/ssr`
- ✅ Migración 0004 aplicada: trigger `handle_new_user` crea tenant + usuario admin automáticamente al registrarse (verificado: signup HTTP 200 creó "Empresa Demo Dia 2")
- ✅ Clientes Supabase (browser/server), middleware de protección de rutas, server actions (signUp/signIn/signOut)
- ✅ Páginas: /registro, /login, /app (panel con conteos por estado + lista), /app/nuevo (card flow industria→template), /app/sesion/[id] (placeholder para chat del Día 3)
- ✅ Landing actualizada: enlaces reales a /login y /registro; copy reposicionado (quitado "listos para ISO 9001")
- ✅ `.env.local` con URL + publishable key (la secreta y Anthropic siguen pendientes, no se necesitan aún)
- ✅ Verificación: tsc 0 errores; curl smoke-test (/, /registro, /login = 200; /app redirige a /login = protección OK)
- ⚠️ DECISIÓN PENDIENTE: email confirmation está ON en Supabase. Recomendación: apagarla para V0 (Auth > Sign In/Providers > Email > desactivar "Confirm email") por límite de 2-3 correos/hora del plan gratis. El código ya maneja ambos casos (muestra "Revisa tu correo" si está ON).
- ⚠️ Next 16 avisa: renombrar `middleware.ts` → `proxy.ts` (deprecación, aún funciona).
- 🧹 Limpieza pendiente: borrar el usuario de prueba t2ma15+dia2@gmail.com y su tenant "Empresa Demo Dia 2" (soft-delete) cuando se quiera.
- ⏳ Pendiente: commit + push a GitHub (proteger el trabajo).

## 11-12 jun 2026 (madrugada) — DÍA 3: EL CEREBRO ✅ (probado en vivo)
- ✅ Día 1-2 commiteado y pusheado a GitHub (commit 16c6beb)
- ✅ Instalado `@anthropic-ai/sdk`
- ✅ Brain construido: `src/lib/brain/` (client, prompts con principios Lean, schema de extracción estructurada), ruta `/api/brain/extract`, componente `Chat.tsx`, integrado en la página de sesión
- ✅ Llave de Anthropic en `.env.local` (cuenta tiene $20 crédito). **Fable 5 suspendido en la cuenta de Tania → brain fijado a `claude-opus-4-8`** (BRAIN_MODEL env, correcto).
- ✅ **PRUEBA EN VIVO EXITOSA** (`tools/brain-test.mjs`): con un proceso informal de planta, Opus 4.8 extrajo 11 campos, hizo 6 preguntas (5 críticas de seguridad/calidad que el operador no mencionó: EPP, bloqueos, presión, qué hacer fuera de rango, calibración), sugirió 3 docs relacionados, todo en español. Costo: $0.0366/documento (~4 centavos). Comportamiento Lean confirmado.
- ⏳ Falta: prueba click-through en navegador del flujo completo (registro→nuevo→chat) — Chrome bloquea localhost, lo hace Tania. El brain core ya está probado; la ruta usa exactamente la misma llamada.

## 12 jun 2026 (madrugada) — DÍA 4: el cerebro CONVERSA ✅ (probado en vivo)
- ✅ Día 3 commiteado+pusheado (commit 06c66c6)
- ✅ Schema extendido: `still_missing[]` + `ready_to_generate` (boolean)
- ✅ Prompt multi-turno: estado acumulado en `extracted`, `summary` solo cambios, no repetir preguntas respondidas, declarar listo
- ✅ Ruta API: ahora carga la conversación completa (hasta 60 msgs) y la pasa a Claude → el brain acumula; reemplaza brain_extractions con el estado completo; related_docs solo en 1er turno; status='confirmed' cuando listo
- ✅ Chat.tsx: banner verde "¡Listo!" + botón "Generar documento" (deshabilitado hasta Día 5); initialReady desde session.status
- ✅ **PRUEBA MULTI-TURNO EXITOSA** (`tools/brain-test-multiturn.mjs`): turno 1 → listo=false, 3 faltantes, 4 preguntas; turno 2 (usuario responde) → listo=TRUE, 0 preguntas, 20 campos acumulados (subió de 11), resumen solo de lo nuevo + felicitación. Comportamiento Lean confirmado.
- ⏳ Falta: prueba click-through en navegador (Tania) + apagar email confirmation en Supabase.

**Próximo (Día 5) toca:** Generador SOP Manufactura (DOCX en español, con `docx` npm) — leer brain_extractions → producir el Word formal con membrete, numeración, bloque de aprobación. Habilitar el botón "Generar documento".

### Recordatorios de día para Tania (comercial, ~30 min)
- Emails de oro HOY: CompetISO (capacitacion@aneih.org.do) y LEAN CONSULTING RD (info@leanconsultingrd.com)
- Llamar MICM ext. 1041 (programa €11MM)
- DNS manualcore.com → Vercel + Zoho (cuando pueda)
