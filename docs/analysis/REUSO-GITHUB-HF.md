# Reúso de GitHub + Hugging Face para ManualCore

Investigación verificada (jun-2026). Cada candidato fue comprobado: que exista, esté
mantenido y que su **licencia permita uso comercial en un SaaS cerrado**.

Regla de licencias: para **código que empotramos** queremos permisivas (MIT / Apache / BSD).
**GPL/AGPL** = solo referencia, no se puede empotrar. Para **modelos/datasets** deben permitir
uso comercial (cuidado con NonCommercial / CC-BY-NC).

Leyenda: **ADOPTAR** (úsalo ya) · **PROBAR** (piloto) · **VIGILAR** (radar) · **EVITAR** (trampa de licencia / no encaja).

---

## 1. PDF con trazabilidad de impresión  *(función que ya habías pedido)*
- **ADOPTAR — pdfmake** (MIT) — PDF en JS puro, sin Chromium. Su pie de página es una función
  `(pagina, total) => ...`, ideal para estampar "Impreso por {usuario} — {fecha} — Copia #{n} —
  COPIA NO CONTROLADA" en cada hoja, distinto por impresión. https://github.com/bpampuch/pdfmake
- VIGILAR — **pdf-lib** (MIT, versión oficial estancada → usar fork `@cantoo/pdf-lib`) — para
  *estampar* trazabilidad sobre un PDF ya hecho. https://github.com/Hopding/pdf-lib
- ADOPTAR (alternativa HTML→PDF) — **puppeteer** (Apache-2.0) — convierte nuestro HTML de marca a
  PDF perfecto; pesa más (necesita Chromium en el servidor). https://github.com/puppeteer/puppeteer

## 2. Flujograma ANSI  *(función pendiente)*
- **ADOPTAR — Graphviz vía @viz-js/viz** (MIT/EPL, WASM) — el cerebro emite DOT; rombos de decisión,
  swimlanes (clusters), SVG en el servidor sin navegador. La vía limpia para el documento. https://github.com/mdaines/viz-js
- ADOPTAR (preview) — **Mermaid** (MIT) — el cerebro genera texto `flowchart TD`, preview en vivo en el
  navegador. Para imprimir headless necesita Chromium → usar Graphviz para el entregable. https://github.com/mermaid-js/mermaid
- PROBAR (editor interactivo, futuro) — **React Flow @xyflow/react** (MIT) + **dagre** (MIT) para
  autolayout. Que el usuario reacomode el flujo. https://github.com/xyflow/xyflow
- EVITAR — **bpmn-js**: licencia obliga a una **marca de agua bpmn.io NO removible** en cada diagrama
  → aparecería en los documentos del cliente.

## 3. Voz (entrada por voz — diferenciador)
- **ADOPTAR (fácil, sin backend) — transformers.js** (Apache) — dictado Whisper en el navegador,
  audio queda en el equipo (privacidad + costo). Mejora el `webkitSpeechRecognition` actual. https://github.com/huggingface/transformers.js
- ADOPTAR (precisión, servidor) — **whisper-large-v3-turbo** (MIT) corrido con **faster-whisper**
  (MIT, CTranslate2 INT8 = sin factura de GPU). https://github.com/SYSTRAN/faster-whisper
- PROBAR (offline/escritorio) — **whisper.cpp** (MIT). VIGILAR — **distil-whisper-large-v3-es**
  (MIT, español) si gana en pruebas con audio dominicano real.

## 4. Foto / OCR (entrada por foto — diferenciador)
> Nota: para fotos de pizarra/máquina, **Claude (visión) ya cubre** "describe el proceso". Estos
> motores agregan valor para **formatos densos, tablas y documentos escaneados**.
- ADOPTAR (cuando haga falta precisión en tablas/escaneos) — **dots.ocr** (MIT, un solo modelo:
  layout + tablas a HTML + orden de lectura, 100+ idiomas). https://huggingface.co/rednote-hilab/dots.ocr
- ADOPTAR (alternativa robusta) — **PaddleOCR / PaddleOCR-VL** (Apache-2.0). Pesa (runtime Paddle, GPU). https://github.com/PaddlePaddle/PaddleOCR
- PROBAR — **Qwen2.5-VL-7B** (Apache; **usar 7B, NUNCA el 3B** que es NonCommercial) para "entender"
  una foto de pizarra. **docTR** (Apache, instalar sin el extra `[html]` que arrastra GPLv2) +
  **Table Transformer** (MIT) como vía económica en CPU.

## 5. Extracción estructurada (hacer el cerebro más confiable)
- **ADOPTAR — Zod 4** (`z.toJSONSchema`, MIT) — defines el esquema una vez = esquema de Anthropic +
  validación + tipos TS. https://github.com/colinhacks/zod
- **ADOPTAR — Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`, Apache) — `generateObject`/`streamObject`
  devuelven objetos validados; `streamObject` permite preview del documento mientras se genera. https://github.com/vercel/ai
- **ADOPTAR (calidad/CI) — promptfoo** (MIT) — pruebas que garantizan que CCP/EPP/registros sigan
  saliendo cuando cambiemos prompts o de modelo. https://github.com/promptfoo/promptfoo
- PROBAR — **BAML** (Apache) — DSL tipado con playground en VSCode (útil para iterar prompts). https://github.com/BoundaryML/baml
- EVITAR/SALTAR — instructor-js (estancado, lo cubre AI SDK) · Outlines (Python; Claude no expone logits).

## 6. Bilingüe ES/EN + expansión por idiomas
- **ADOPTAR — next-intl** (MIT) — i18n nativo de Next.js App Router/RSC, ICU (plurales en español). https://github.com/amannn/next-intl
- PROBAR (traducción barata) — **OPUS-MT** (Apache, por par ES↔EN) o **M2M100** (MIT, 100 idiomas en
  un modelo) para pre-traducir y luego pulir con Claude (ahorra tokens). Alternativa i18n: **i18next**.
- PROBAR (back-office) — **Tolgee** (Apache core) para gestionar catálogos de traducción.
- **EVITAR — NLLB-200**: licencia **NonCommercial**. Si hace falta idioma raro, usar MADLAD-400 (Apache).

## 7. Patrones de QMS / control documental (para nuestra Fase B)
- PROBAR (referencia + helpers MIT) — **innolitics/rdm** (MIT) — metadata por documento (id+revisión+
  título), **matriz de trazabilidad autogenerada** y chequeo de "gaps" (secciones requeridas). Muy
  alineado con nuestra matriz de referenciamiento y validación de completitud. https://github.com/innolitics/rdm
- VIGILAR (solo estudiar el modelo de datos, **AGPL = no copiar código**) — **OCA/management-system**
  (Odoo) — el modelo relacional más maduro: manual > procedimiento > instrucción, revisiones,
  aprobaciones, CAPA. https://github.com/OCA/management-system
- VIGILAR (algoritmo de numeración, MIT) — **soypat/go-qap** (convención CERN de códigos+revisión).
- **EVITAR para contenido** — openregulatory/templates (CC-BY-NC-SA) y los addons Odoo ISO 9001 (AGPL):
  solo inspiración de estructura, no copiar texto ni código.

## 8. Datasets (honesto: escasos y con trampas de licencia)
- PROBAR (eval de orden de pasos, MIT) — **tasksource/goal-step-wikihow**. https://huggingface.co/datasets/tasksource/goal-step-wikihow
- VIGILAR (eval de seguridad, Apache, diminuto 34 filas) — **codelion/worker-safety-qa-eval**.
- VIGILAR (español genérico, CC-BY) — **bertin-project/alpaca-spanish** (frases en español; sin
  contenido industrial).
- **EVITAR** — MyFixit, sentence-transformers/wikihow (texto fuente), HiTZ/alpaca_mt: **NonCommercial**.
- **Conclusión:** NO hay un buen dataset abierto de SOP/calidad para fine-tune. Camino correcto:
  **few-shot con Claude** + un set de evaluación propio (con promptfoo).

---

## Recomendación de secuencia (qué empotrar y cuándo)
1. **Terminar Fase B** (motor de control documental — hilo actual).
2. **PDF con pie de trazabilidad** → `pdfmake` (entrega una función ya pedida).
3. **Flujograma ANSI** → `@viz-js/viz` (entrega una función pendiente).
4. **Endurecer el cerebro** → `zod` + Vercel `ai` + `promptfoo` (más confiable, con tipos y CI).
5. **Voz** → `transformers.js` (dictado en navegador) ahora; `faster-whisper` servidor después.
6. **App bilingüe** → `next-intl` (requisito de Fase 2).
7. **Foto/OCR avanzado** (`dots.ocr`/PaddleOCR) → solo cuando haga falta leer formatos/tablas densas;
   mientras tanto, la visión de Claude basta.
