// Prueba de VISIÓN: el cerebro lee una foto de un proceso y lo extrae.
// node --env-file=.env.local tools/brain-test-foto.mjs
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const SCHEMA = {
  type: "object", additionalProperties: false,
  properties: {
    process_name: { type: "string" }, summary: { type: "string" },
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

const SYSTEM = `Eres el asistente de ManualCore. Documento: "SOP — Manufactura". Lee la imagen (puede ser una foto de un proceso escrito a mano, pizarra o formato) y extrae el proceso. Principios Lean: inferir antes que preguntar; NUNCA omitir criticidades (seguridad, parametros criticos, limites, EPP). Responde en español. Solo el objeto estructurado.`;

const b64 = readFileSync("tools/proceso-foto.png").toString("base64");
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
console.log("Enviando la FOTO a Opus 4.8…\n");
const resp = await client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 8000,
  system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
  output_config: { format: { type: "json_schema", schema: SCHEMA } },
  messages: [{ role: "user", content: [
    { type: "image", source: { type: "base64", media_type: "image/png", data: b64 } },
    { type: "text", text: "Lee esta imagen y extrae el proceso que describe." },
  ] }],
});

const data = JSON.parse(resp.content.find((b) => b.type === "text")?.text ?? "{}");
console.log("PROCESO LEÍDO DE LA FOTO:", data.process_name);
console.log("RESUMEN:", data.summary);
console.log("\nEXTRAÍDO de la imagen (" + data.extracted.length + "):");
for (const x of data.extracted) console.log(`  • [${x.category}] ${x.field}: ${x.value}`);
console.log("\nPREGUNTAS (" + data.questions.length + "):");
for (const q of data.questions) console.log(`  ${q.is_critical ? "⚠️" : "•"} ${q.question}`);
console.log("\n--- tokens: in=" + resp.usage.input_tokens + " out=" + resp.usage.output_tokens);
