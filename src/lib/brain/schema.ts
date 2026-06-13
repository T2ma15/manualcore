// Esquema de salida estructurada del brain (extracción).
// Respeta las limitaciones de structured outputs: additionalProperties:false,
// sin min/maxLength, sin restricciones numéricas.

export const EXTRACTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    process_name: {
      type: "string",
      description: "Nombre del proceso documentado, inferido del texto.",
    },
    summary: {
      type: "string",
      description:
        "Resumen breve y amable (1-2 frases) de lo que entendiste, en el idioma del usuario.",
    },
    extracted: {
      type: "array",
      description: "Campos que pudiste extraer o inferir con confianza.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string", description: "Nombre del campo (ej: 'Operación 2', 'Material principal')." },
          value: { type: "string", description: "Valor extraído o inferido." },
          category: {
            type: "string",
            enum: ["operacion", "paso", "material", "especificacion", "seguridad", "responsable", "riesgo", "otro"],
          },
          confidence: { type: "string", enum: ["alta", "media", "baja"] },
        },
        required: ["field", "value", "category", "confidence"],
      },
    },
    questions: {
      type: "array",
      description:
        "Preguntas SOLO por campos requeridos que faltan. Nunca por campos opcionales. SIEMPRE incluir criticidades faltantes (seguridad, parámetros críticos, límites de control, EPP).",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          field: { type: "string", description: "Campo que falta." },
          question: { type: "string", description: "La pregunta, directa, en el idioma del usuario." },
          why: { type: "string", description: "Por qué importa (contexto breve)." },
          is_critical: { type: "boolean", description: "true si es una criticidad de seguridad/calidad que NO se puede omitir." },
        },
        required: ["field", "question", "why", "is_critical"],
      },
    },
    related_docs: {
      type: "array",
      description:
        "Documentos mencionados o implicados en el texto que podrían necesitar crearse o referenciarse (ej: un checklist, un análisis de riesgo). El usuario decidirá si ya existen.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Nombre del documento relacionado." },
          reason: { type: "string", description: "Por qué se relaciona con este proceso." },
        },
        required: ["name", "reason"],
      },
    },
    still_missing: {
      type: "array",
      description:
        "Lista breve de los campos requeridos que TODAVÍA faltan tras esta conversación (vacío si ya está completo).",
      items: { type: "string" },
    },
    ready_to_generate: {
      type: "boolean",
      description:
        "true SOLO cuando todos los campos requeridos están cubiertos y NO queda ninguna criticidad pendiente. Si dudas, false.",
    },
  },
  required: [
    "process_name",
    "summary",
    "extracted",
    "questions",
    "related_docs",
    "still_missing",
    "ready_to_generate",
  ],
} as const;

export type Extraction = {
  process_name: string;
  summary: string;
  extracted: { field: string; value: string; category: string; confidence: string }[];
  questions: { field: string; question: string; why: string; is_critical: boolean }[];
  related_docs: { name: string; reason: string }[];
  still_missing: string[];
  ready_to_generate: boolean;
};
