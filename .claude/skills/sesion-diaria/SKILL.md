---
name: sesion-diaria
description: Gerente de proyecto de ManualCore. Usar al INICIO de cada sesión de trabajo (lee dónde quedamos y propone el plan de la noche en 3 líneas) y al FINAL (resume lo logrado y deja nota para mañana). Cero tiempo perdido en "¿dónde estábamos?".
---

# Sesión diaria — apertura y cierre

## Al ABRIR sesión
1. Leer `docs/BITACORA.md` (si no existe, crearlo) — última entrada = dónde quedamos
2. Revisar el calendario de los 10 días (abajo) — qué toca hoy
3. Verificar estado real: ¿el último commit corre? ¿Vercel está verde?
4. Proponer a Tania el plan de la noche en MÁXIMO 3 líneas + pedir su OK
5. Si hubo trabajo de día (DNS, cuentas, decisiones), preguntar el resultado primero

## Al CERRAR sesión
1. Escribir en `docs/BITACORA.md`:
   - Fecha · qué se completó (con ✅) · qué quedó a medias · qué se decidió
   - "Mañana toca:" — la primera tarea concreta del día siguiente
2. Commit + push de todo lo estable
3. Decirle a Tania en 3 líneas: qué se logró, qué falta, qué necesito de ella mañana

## Calendario de los 10 días (11-21 jun 2026)
| Día | Construcción (6pm) |
|---|---|
| 1 | Schema Supabase (migraciones 0001-0003) + tests de reglas + skills ✅ |
| 2 | Auth + registro + creación de tenant + card flow |
| 3 | Chat UI + brain parte 1 (extracción con Claude API) |
| 4 | Brain parte 2 (Questions/Confirmations, persistencia, related_docs) |
| 5 | Generador SOP Manufactura (DOCX español) |
| 6 | Generador SOP Administrativo (DOCX, template distinto) |
| 7 | Flujograma SVG (simple, time-box 1 día) + state machine + numeración |
| 8 | Análisis de Riesgos + Lista Maestra + política/objetivos/alcance |
| 9 | Print PDF con footer + dashboards (tenant y plataforma) + demo-dominicana |
| 10 | QA end-to-end + fixes + inglés (2da pasada) + video demo 🎬 |

## Reglas de la sesión
- Una sesión = un objetivo concreto; no mezclar features
- Si algo se atasca >45 min: simplificar el alcance o moverlo, no perseverar a ciegas
- Tania decide QUÉ, yo decido CÓMO
- Si un día se logra el 70%, está bien — lo crítico va primero (días 1-7 producto, 8-10 venta)
