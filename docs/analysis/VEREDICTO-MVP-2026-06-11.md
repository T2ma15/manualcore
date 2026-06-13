# ManualCore — Veredicto de validación de MVP y matrices
**Fecha:** 11 junio 2026 · **Método:** 7 análisis independientes (matrices, MVP, competidores, cliente ISO, mercado RD, auditor ISO 9001, síntesis)
**Archivos de detalle:** `wf_sintesis.json`, `wf_matrices.json`, `wf_mvp.json`, `wf_competidores.json`, `wf_cliente.json`, `wf_rd.json`, `wf_iso.json` (esta carpeta)

---

## Veredicto: SÍ, el MVP es el correcto — CON AJUSTES

La intersección **"extracción conversacional con IA + documento industrial formal + control documental ISO + español + precio micro-PyME" está LIBRE**. Ninguno de los ~20 competidores analizados la ocupa completa, aunque cada ingrediente por separado ya existe.

**El foso competitivo es el control documental** (estados, numeración, owner≠approver, audit log, trazabilidad de impresión), **NO la generación con IA**. Eso es lo que ChatGPT, Scribe, Whale y los QMS baratos no entregan juntos — y es exactamente lo que el auditor revisa (cláusula 7.5).

Mantener sin tocar: 2 SOPs distintos (Mfg/Admin), control documental, audit log inmutable, RLS desde día 1, patrón Question/Confirmation.

## Los 4 ajustes al MVP

1. **ESPAÑOL por defecto, no negociable.** Las PyMEs dominicanas se certifican contra NORDOM ISO 9001 en español. Un SOP en inglés en planta = no conformidad de facto (7.5.2.b). Templates, prompts, chat y PDF en español desde el día 1.
2. **Reposicionar el mensaje.** El V0 cubre ~25-30% de lo que examina una auditoría (0 de 4 documentos obligatorios, 0 de 18 registros). Vender como **"formaliza y controla tu documentación de procesos"**, NUNCA "te deja listo para ISO 9001". Añadir al pitch: "ninguna palabra llega a Approved sin aprobación humana".
3. **Recortar ceremonia** (ahorra 3-5 días que van al brain, que es el core):
   - 4 estados: Draft→Under Review→Approved→Obsolete (sin "Released" en V0) + modelar rechazo
   - Flowchart simplificado con time-box de 1 día (layout ANSI automático = sumidero #1 de ingeniería)
   - Footer de impresión simple, sin UI de copias numeradas
   - Sin dashboard de plataforma en V0 (Tania usa Supabase Studio); dashboard de tenant sí queda
4. **Añadir faltantes baratos de alto valor:**
   - Lista Maestra de Documentos exportable (~1 día — lo PRIMERO que pide el auditor)
   - 3 templates estáticos: política de calidad (5.2), objetivos (6.2), alcance (4.3) (~1-2 días)

## Las matrices: buenas de visión, NO construibles tal cual

Cambios "AHORA" (antes de crear el schema en Supabase):
1. `tenant_id` en TODAS las tablas (hoy solo 6 de 32) + RLS uniforme
2. `users.auth_user_id` → vínculo con Supabase Auth (sin esto, RLS es inimplementable)
3. Congelar V0 a ~14-16 tablas; las otras ~12 quedan como diseño v1.1 (no crear vacías)
4. Definir columnas de `brain_extractions`, `input_files`, `generation_jobs` (con idempotency_key + costo API), `print_events`, `access_grants` — hoy no tienen ni una columna
5. Tabla `departments` + `doc_number_counters` con incremento atómico; REV derivado, no parte del número
6. Tabla `document_templates` con `sop_mfg` y `sop_admin` DISTINTOS (el doc_type actual no tiene sop_admin)
7. `tenants.locale` + `documents.language` default 'es'
8. NO purgar historial a 5 revisiones (ISO 7.5.3.2 exige retención; flag de display solamente)
9. `ownership.revision_id` — firmas por revisión (hoy re-aprobar REV02 borra las firmas de REV01)
10. Formato 'pdf' + `print_events.pdf_snapshot_url` (guardar el PDF exacto impreso)
11. Inmutabilidad de audit_log como MECANISMO (REVOKE + trigger), no convención
12. 4 estados + transición de rechazo con comentario obligatorio
13. Limpiar: FK circular sessions↔nodes, gauge_id mal modelado, updated_at genérico, TEXT+CHECK en vez de ENUM
14. **Migraciones SQL versionadas en el repo = nueva fuente de verdad. El Excel pasa a ser documento de visión.**

Antes de beta: tabla `external_documents`, `revisions.data_snapshot`, vista Lista Maestra, historial de revisiones EN el documento.
V1: controlled_copies + recall, separar catálogo de materiales, **Caracterización de Proceso / ficha de proceso** (expectativa LatAm universal que NO está en los 18 templates — punto ciego detectado), registros NC/auditoría interna/revisión por dirección.

## El mercado (resumen)

- **RD:** ~41-150 empresas certificadas ISO 9001; 843 empresas en zonas francas; pipeline de ~250 mipymes con financiamiento MICM-UE (€11MM). Suficiente para validar y los primeros 20-50 clientes; el plan base post-validación es LatAm hispana.
- **Precio:** $49/mes tiene espacio real (<5% del costo de certificación: auditoría US$1,200-3,500 + consultoría aparte; 5x más barato que Isolución). Considerar tier $99-149 para zonas francas.
- **Canal:** consultores ISO dominicanos (CompetISO/ANEIH concentra ~62% de PyMEs certificadas) — aliados, no competencia. 1 consultor puede traer los 3 pilotos.
- **Amenaza 12-24 meses:** QMS LatAm añadiendo IA (KAWAK ya lo anunció; QualityWeb 360 a $50/mes está a un feature). La ventana es moverse rápido.
- **Riesgo principal:** sobrecarga de alcance en 10 días que sacrifica la calidad de extracción del brain, en un mercado pequeño donde todos se conocen y no hay segunda primera impresión.

## Pivotes a considerar (no urgentes, anotar)

- **Concierge primeros 30 días:** sesiones por Zoom/WhatsApp usando Claude + templates a mano, COBRANDO desde semana 1. Valida disposición a pagar de inmediato; las sesiones reales entrenan el brain.
- **Consultor como comprador (B2B2B):** licencia multi-cliente para consultores ISO. Mínimo: rol "consultor" al roadmap.
- **Chat que agrupa preguntas** (gap-report en batch) — evita fatiga de "una pregunta a la vez" en procesos de 12+ pasos.
- **Post-validación:** ISO 13485 para las ~31 empresas de dispositivos médicos de zonas francas (transición FDA QMSR vigente desde 2026).

## Métrica de validación del piloto

> "Un consultor ISO externo acepta N documentos generados sin retrabajo mayor."
> Esa es la señal de que vale dinero. No la cantidad de features ni el uso.

Condición de piloto: carta de conversión firmada a $49/mes al cierre (o LOI con precio).

---

## ISO 9001:2026 (verificado 11 jun 2026)

- FDIS en votación desde abril 2026; publicación prevista **septiembre 2026**; transición de 3 años hasta sep 2029. Certificados 2015 válidos durante la transición.
- Cambios menores en cláusulas 4-10; **la 7.5 (información documentada) queda esencialmente igual** → la lógica de matrices de ManualCore es agnóstica a la versión de la norma.
- Acciones: `document_templates.norm_version`; redactar política/objetivos/alcance "2026-ready" (cultura de calidad + ética).
- Oportunidad comercial: la ola de transición 2026-2029 obliga a todas las certificadas a actualizar documentación. Pitch: "tus documentos viven en una matriz — cuando cambia la norma, regeneras, no reescribes".

## Decisiones de la fundadora (11 jun 2026)

| # | Decisión | Resultado |
|---|---|---|
| A | Idioma | **Español E inglés** (bilingüe). Secuencia: español primero (pilotos RD), estructura bilingüe desde día 1, contenido inglés en segunda pasada |
| B | Released + dashboard plataforma | **SE QUEDAN en V0** — necesarios para mostrar valor en demos/venta |
| C | Lista Maestra + política/objetivos/alcance | **SÍ** se agregan al V0 |
| D | Carta de conversión pilotos | **SÍ**, con periodo de prueba máximo **7 días** antes de convertir a $49/mes |
