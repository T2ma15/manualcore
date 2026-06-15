import { writeFileSync } from "fs";
import { anthropic, BRAIN_MODEL } from "../src/lib/brain/client";
import { buildSystemPrompt } from "../src/lib/brain/prompts";
import { EXTRACTION_SCHEMA, type Extraction } from "../src/lib/brain/schema";
import { generateDocumentContent } from "../src/lib/brain/document";
import { generateDocx } from "../src/lib/docgen/docx";
import type { DocData, RelatedDoc } from "../src/lib/docgen/types";

const TEMPLATE = { code: "sop_mfg", name_es: "SOP — Manufactura", name_en: "SOP — Manufacturing" };

type Turn = { role: "user" | "assistant"; content: string };

// Conversación COMPLETA: incluye dónde se registra y la frecuencia.
const conversation: Turn[] = [
  {
    role: "user",
    content:
      "Ensamble de tapa con riveteadora neumática. El operador coloca la tapa sobre la base, alinea los dos agujeros y aplica el remache. Fuerza 450 N +/- 20. Remaches de aluminio SKU RA-450, uno por ensamble. Inspección visual de rebaba. Lo hace Juan en la línea 3. Pasa a empaque.",
  },
  { role: "assistant", content: "¿Qué EPP usa el operador y qué pasa si la fuerza sale de rango?" },
  {
    role: "user",
    content:
      "Usa lentes de seguridad, guantes y protección auditiva. La riveteadora tiene guarda de dos manos. Presión de aire 6 bar. Si la fuerza sale de 430-470 N o hay rebaba, se rechaza la pieza y se reporta al supervisor. Aprueba María Díaz, jefa de calidad. La fuerza de cada remache se anota en la hoja 'Control de remachado' por lote, y la calibración del sensor se registra en el formato de calibración cada 6 meses.",
  },
];

// Conversación INCOMPLETA: NO dice dónde se registra ni con qué frecuencia.
const conversationSinRegistro: Turn[] = [
  {
    role: "user",
    content:
      "Ensamble de tapa con riveteadora. Fuerza 450 N +/- 20. El operador inspecciona la rebaba en cada pieza. Si sale mal, se rechaza. Lo hace Juan en la línea 3.",
  },
];

async function extract(convo: Turn[]): Promise<Extraction> {
  const client = anthropic();
  const resp = await client.messages.create({
    model: BRAIN_MODEL,
    max_tokens: 8000,
    system: [
      { type: "text", text: buildSystemPrompt(TEMPLATE, "es"), cache_control: { type: "ephemeral" } },
    ],
    output_config: { format: { type: "json_schema", schema: EXTRACTION_SCHEMA } },
    messages: convo.map((m) => ({ role: m.role, content: m.content })),
  });
  const block = resp.content.find((b) => b.type === "text");
  return JSON.parse(block && "text" in block ? block.text : "{}") as Extraction;
}

async function main() {
  // 1) Prueba de que el cerebro PREGUNTA dónde se registra cuando falta.
  console.log("──────────────────────────────────────────");
  console.log("PRUEBA 1 — el cerebro detecta un control sin registro y PREGUNTA:");
  const ex0 = await extract(conversationSinRegistro);
  for (const q of ex0.questions) {
    console.log(`  ${q.is_critical ? "⚠️ " : ""}${q.question}  (${q.why})`);
  }
  console.log("");

  // 2) Conversación completa → criticidad + registros relacionados.
  console.log("PRUEBA 2 — el cerebro infiere criticidad y enlaza registros:");
  const ex = await extract(conversation);
  console.log("  Puntos de control críticos detectados:");
  for (const x of ex.extracted.filter((e) => e.is_critical)) {
    console.log(`    🔒 ${x.field}: ${x.value}`);
  }
  console.log("  Documentos / registros relacionados:");
  for (const d of ex.related_docs) {
    console.log(`    • ${d.name} [${d.type}] — ${d.relation} — frecuencia: ${d.frequency || "?"}`);
  }
  console.log("");

  // 3) Redactar el contenido + generar el Word con la matriz de relacionados.
  console.log("Generando el Word…");
  const content = await generateDocumentContent(conversation, "sop_mfg", TEMPLATE.name_es, "es");

  const relatedDocs: RelatedDoc[] = ex.related_docs.map((d) => ({
    title: d.name,
    type: d.type,
    relation: d.relation,
    frequency: d.frequency || null,
    code: null,
    status: "suggested",
  }));

  const data: DocData = {
    tenantName: "Industrias Quisqueya SRL",
    logoDataUrl: null,
    templateCode: "sop_mfg",
    templateName: TEMPLATE.name_es,
    processName: content?.title ?? "Ensamble de tapa con riveteadora",
    docNumber: "SOP-MFG-001",
    revision: "REV00",
    status: "approved",
    effectiveDate: "2026-06-14",
    reviewDue: "2027-06-14",
    owner: "Juan Pérez",
    approver: "María Díaz",
    extracted: [],
    sections: content?.sections ?? null,
    relatedDocs,
  };

  const buf = await generateDocx(data);
  const out = "C:\\Users\\tmate\\Downloads\\SOP-ManualCore-ejemplo.docx";
  writeFileSync(out, buf);
  console.log("Documento generado:", out, "(" + buf.length + " bytes)");
}
main();
