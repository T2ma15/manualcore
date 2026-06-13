// Prueba directa del brain: confirma que Opus 4.8 extrae y pregunta bien.
// Correr: node --env-file=.env.local tools/brain-test.mjs
import Anthropic from "@anthropic-ai/sdk";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    process_name: { type: "string" },
    summary: { type: "string" },
    extracted: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string" },
          value: { type: "string" },
          category: { type: "string", enum: ["operacion", "paso", "material", "especificacion", "seguridad", "responsable", "riesgo", "otro"] },
          confidence: { type: "string", enum: ["alta", "media", "baja"] },
        },
        required: ["field", "value", "category", "confidence"],
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string" },
          question: { type: "string" },
          why: { type: "string" },
          is_critical: { type: "boolean" },
        },
        required: ["field", "question", "why", "is_critical"],
      },
    },
    related_docs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { name: { type: "string" }, reason: { type: "string" } },
        required: ["name", "reason"],
      },
    },
  },
  required: ["process_name", "summary", "extracted", "questions", "related_docs"],
};

const SYSTEM = `Eres el asistente de ManualCore, experto en documentación de procesos industriales para personas SIN experiencia en documentación. Documento: "SOP — Manufactura".
Principios Lean: 1) Inferir antes que preguntar. 2) No preguntar campos opcionales. 3) NUNCA omitir criticidades (seguridad, parámetros críticos, límites de control CCP/USL/LSL, EPP) — siempre pregúntalas si faltan y marca is_critical=true. 4) Documentos relacionados: si se mencionan, inclúyelos en related_docs (el usuario decide si existen). 5) Conciso y cálido.
Campos requeridos: nombre del proceso, operaciones en secuencia, materiales con cantidades, parámetros críticos y límites, seguridad y EPP, responsable, 5M.
Responde TODO en español. Devuelve solo el objeto estructurado.`;

const INPUT = `En la operación de ensamble de tapa usamos una riveteadora neumática.
El operador coloca la tapa sobre la base, alinea los dos agujeros y aplica el remache.
La fuerza del remache es de 450 newton, más o menos 20. Usamos remaches de aluminio
SKU RA-450. Después se inspecciona visualmente que no haya rebaba. Lo hace Juan en la
línea 3. Al final pasa al área de empaque.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
console.log("Llamando a Opus 4.8…\n");
const resp = await client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 8000,
  system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
  output_config: { format: { type: "json_schema", schema: SCHEMA } },
  messages: [{ role: "user", content: INPUT }],
});

const text = resp.content.find((b) => b.type === "text")?.text ?? "{}";
const data = JSON.parse(text);

console.log("PROCESO:", data.process_name);
console.log("\nRESUMEN:", data.summary);
console.log("\nEXTRAÍDO (" + data.extracted.length + "):");
for (const x of data.extracted) console.log(`  • [${x.category}] ${x.field}: ${x.value} (${x.confidence})`);
console.log("\nPREGUNTAS (" + data.questions.length + "):");
for (const q of data.questions) console.log(`  ${q.is_critical ? "⚠️ CRÍTICA" : "•"} ${q.question}`);
console.log("\nDOCS RELACIONADOS (" + data.related_docs.length + "):");
for (const d of data.related_docs) console.log(`  • ${d.name} — ${d.reason}`);
console.log("\n--- tokens: in=" + resp.usage.input_tokens + " out=" + resp.usage.output_tokens +
  " | costo ≈ $" + ((resp.usage.input_tokens * 5 + resp.usage.output_tokens * 25) / 1e6).toFixed(4));
