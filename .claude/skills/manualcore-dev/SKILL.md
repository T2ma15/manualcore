---
name: manualcore-dev
description: Guardián de la arquitectura de ManualCore. Usar en CUALQUIER sesión que escriba o modifique código del proyecto — asegura que cada cambio respete las reglas no-negociables, el stack, la marca y las decisiones de producto.
---

# ManualCore — Reglas de desarrollo

## Identidad del producto
- **ManualCore** — Process Knowledge Formalization Engine. Tagline: "Every process. Fully documented."
- NO es un QMS. Es un motor de documentación con IA para personal SIN expertise documental.
- La sensación objetivo del usuario: **desahogo**. Cero jerga, cero manual de uso, el brain guía.

## Stack (no cambiar sin decisión explícita de Tania)
- Next.js (App Router) + TypeScript + Tailwind v4 — repo `C:\Users\tmate\Projects\manualcore`
- Supabase (proyecto `iybgndufnrogdbkpbbrl`): Postgres + Auth + Storage, RLS multi-tenant
- Claude API (extracción/chat), `docx` npm (DOCX), SVG server-side (flujogramas), `pdf-lib` (print)
- Vercel (deploy), Resend (email)
- **Fuente de verdad del schema: `supabase/migrations/` — NUNCA el Excel de matrices**

## Reglas NO-NEGOCIABLES (verificar en cada PR/cambio)
1. `tenant_id` en toda tabla nueva + política RLS uniforme (`current_tenant_id()`)
2. `audit_log` inmutable — jamás UPDATE/DELETE, ni siquiera "para arreglar un dato"
3. `owner_id ≠ approver_id` (constraint DB, no solo UI)
4. `review_due` obligatorio para Under Review/Approved
5. `doc_number` y `revision_number` son system-managed — jamás asignables por el usuario
6. `connection_type` y `next_node_id` se mueven juntos
7. ManualCore INVISIBLE en documentos generados — solo marca del tenant
8. Chat-first: toda interacción brain-usuario es conversacional con action buttons
9. Templates renderizan desde la matriz — nunca tienen data propia
10. SOP Manufactura y SOP Administrativo son templates DISTINTOS (no label-switching)

## Bilingüe / i18n
- `tenants.locale` y `documents.language`: 'es' (default) | 'en'
- **NINGÚN texto de UI hardcodeado** — todo en archivos de traducción desde el día 1
- Contenido español primero; estructura siempre bilingüe; futuro: pt y más

## Marca (spec §12.2)
- Navy `#0D1F3C` · Steel `#1B4F72` · Teal `#1ABC9C` · Arial
- Tokens ya definidos en `src/app/globals.css` (--mc-navy, --mc-steel, --mc-teal)

## Brain — principios Lean (de Tania)
1. Inferir antes que preguntar
2. No preguntar campos opcionales
3. NUNCA omitir criticidades: seguridad, parámetros críticos, CCP/USL/LSL, EPP
4. Documentos relacionados: preguntar "¿ya existe?" → si sí, pedir nombre/código; si no, sugerir crear
5. Una pregunta a la vez; agrupar en gap-report si la sesión se alarga

## Posicionamiento en copy
- Decir: "formaliza y controla tu documentación de procesos"
- JAMÁS decir: "te deja listo para ISO 9001" ni describirlo como QMS
- Siempre: "ninguna palabra llega a Approved sin aprobación humana"

## Workflow de trabajo
- Commits pequeños y frecuentes; probar en navegador antes de marcar terminado
- Tania es no-técnica: explicarle cada paso en español simple, una acción a la vez
