// Validación tolerante de las salidas del cerebro (red de seguridad).
// Cada campo tiene .catch(default) para que un JSON imperfecto NUNCA rompa la
// app: se normaliza a una forma válida en vez de lanzar excepción.
import { z } from "zod";

const ExtractedItemZ = z
  .object({
    field: z.string().catch(""),
    value: z.string().catch(""),
    category: z.string().catch("otro"),
    confidence: z.string().catch("media"),
    is_critical: z.boolean().catch(false),
  })
  .catch({ field: "", value: "", category: "otro", confidence: "media", is_critical: false });

const QuestionZ = z
  .object({
    field: z.string().catch(""),
    question: z.string().catch(""),
    why: z.string().catch(""),
    is_critical: z.boolean().catch(false),
  })
  .catch({ field: "", question: "", why: "", is_critical: false });

const RelatedDocZ = z
  .object({
    name: z.string().catch(""),
    type: z.string().catch("registro"),
    relation: z.string().catch(""),
    frequency: z.string().catch(""),
    reason: z.string().catch(""),
  })
  .catch({ name: "", type: "registro", relation: "", frequency: "", reason: "" });

export const ExtractionZ = z
  .object({
    process_name: z.string().catch(""),
    summary: z.string().catch(""),
    extracted: z.array(ExtractedItemZ).catch([]),
    questions: z.array(QuestionZ).catch([]),
    related_docs: z.array(RelatedDocZ).catch([]),
    still_missing: z.array(z.string()).catch([]),
    ready_to_generate: z.boolean().catch(false),
  })
  .catch({
    process_name: "",
    summary: "",
    extracted: [],
    questions: [],
    related_docs: [],
    still_missing: [],
    ready_to_generate: false,
  });

const SectionZ = z
  .object({
    heading: z.string().catch(""),
    kind: z.enum(["text", "steps", "table"]).catch("text"),
    text: z.string().catch(""),
    steps: z.array(z.string()).catch([]),
    columns: z.array(z.string()).catch([]),
    rows: z.array(z.object({ cells: z.array(z.string()).catch([]) }).catch({ cells: [] })).catch([]),
  })
  .catch({ heading: "", kind: "text", text: "", steps: [], columns: [], rows: [] });

export const DocContentZ = z
  .object({
    title: z.string().catch(""),
    sections: z.array(SectionZ).catch([]),
  })
  .catch({ title: "", sections: [] });
