// Prueba multi-turno: el brain debe acumular contexto y declarar ready_to_generate.
// node --env-file=.env.local tools/brain-test-multiturn.mjs
import Anthropic from "@anthropic-ai/sdk";

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    process_name: { type: "string" },
    summary: { type: "string" },
    extracted: { type: "array", items: { type: "object", additionalProperties: false,
      properties: { field: { type: "string" }, value: { type: "string" },
        category: { type: "string", enum: ["operacion","paso","material","especificacion","seguridad","responsable","riesgo","otro"] },
        confidence: { type: "string", enum: ["alta","media","baja"] } },
      required: ["field","value","category","confidence"] } },
    questions: { type: "array", items: { type: "object", additionalProperties: false,
      properties: { field: { type: "string" }, question: { type: "string" }, why: { type: "string" }, is_critical: { type: "boolean" } },
      required: ["field","question","why","is_critical"] } },
    related_docs: { type: "array", items: { type: "object", additionalProperties: false,
      properties: { name: { type: "string" }, reason: { type: "string" } }, required: ["name","reason"] } },
    still_missing: { type: "array", items: { type: "string" } },
    ready_to_generate: { type: "boolean" },
  },
  required: ["process_name","summary","extracted","questions","related_docs","still_missing","ready_to_generate"],
};

const SYSTEM = `Eres el asistente de ManualCore, experto en documentación para personas sin experiencia. Documento: "SOP — Manufactura".
Principios Lean: inferir antes que preguntar; no preguntar opcionales; NUNCA omitir criticidades (seguridad, parámetros críticos, límites, EPP); documentos relacionados como sugerencia; conciso y cálido.
Campos requeridos: nombre del proceso, operaciones, materiales con cantidades, parámetros críticos y límites, seguridad y EPP, responsable, 5M.
Multi-turno: 'extracted' = estado COMPLETO acumulado; 'summary' = solo lo que cambió este turno; 'questions' = solo lo que aún falta (no repitas respondidas); 'still_missing' = requeridos que faltan; 'ready_to_generate' = true SOLO cuando todo requerido está y no queda criticidad pendiente; cuando complete, felicita y deja questions vacío.
Responde en español. Solo el objeto estructurado.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function turn(convo) {
  const resp = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: convo,
  });
  const data = JSON.parse(resp.content.find((b) => b.type === "text")?.text ?? "{}");
  return { data, usage: resp.usage };
}

const convo = [];

// TURNO 1: descripción inicial
convo.push({ role: "user", content: `Ensamble de tapa con riveteadora neumática. El operador coloca la tapa, alinea los dos agujeros y aplica el remache. Fuerza 450 N ±20. Remaches de aluminio SKU RA-450. Inspección visual de rebaba. Lo hace Juan en línea 3. Pasa a empaque.` });
let r = await turn(convo);
console.log("== TURNO 1 ==");
console.log("ready:", r.data.ready_to_generate, "| faltan:", r.data.still_missing.length, "->", r.data.still_missing.join("; "));
console.log("preguntas:", r.data.questions.map((q) => (q.is_critical ? "⚠️" : "•") + q.field).join(" | "));

// TURNO 2: el usuario responde TODO de una vez
convo.push({ role: "assistant", content: r.data.summary });
convo.push({ role: "user", content: `El operador usa lentes de seguridad, guantes y protección auditiva. La riveteadora tiene guarda de dos manos para evitar atrapamiento. Presión de aire 6 bar. Se usa 1 remache por ensamble. La fuerza se mide con el sensor integrado de la riveteadora, calibrado cada 6 meses. Si la fuerza sale de 430-470 N o hay rebaba, se rechaza la pieza y se reporta al supervisor. Aprobador: María, jefa de calidad. Método: trabajo estándar documentado. Medición: sensor de fuerza.` });
r = await turn(convo);
console.log("\n== TURNO 2 (usuario respondió las críticas) ==");
console.log("resumen:", r.data.summary);
console.log("ready:", r.data.ready_to_generate, "| faltan:", r.data.still_missing.length, "->", r.data.still_missing.join("; "));
console.log("preguntas restantes:", r.data.questions.length);
console.log("campos totales acumulados:", r.data.extracted.length);
console.log("\nVEREDICTO:", r.data.ready_to_generate ? "✅ El cerebro sabe que terminó" : "⏳ aún pide más");
