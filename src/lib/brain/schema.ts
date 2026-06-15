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
          is_critical: {
            type: "boolean",
            description:
              "true si este dato es un PUNTO DE CONTROL crítico (seguridad, parámetro crítico, límite CCP/USL/LSL, EPP). No se puede omitir ni perder de vista.",
          },
        },
        required: ["field", "value", "category", "confidence", "is_critical"],
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
        "Documentos o REGISTROS implicados por el proceso. REGLA: todo lo que se mide, inspecciona, verifica o registra DEBE quedar en un registro/formato — inclúyelo aquí. También otros SOP, políticas o análisis mencionados. El usuario decidirá si ya existe o se crea.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Nombre del documento o registro relacionado." },
          type: {
            type: "string",
            enum: [
              "registro",
              "checklist",
              "formato",
              "instructivo",
              "sop",
              "politica",
              "analisis_riesgo",
              "plan_inspeccion",
              "otro",
            ],
            description:
              "Tipo de documento. Si en él se anotan mediciones/inspecciones, usa 'registro' o 'checklist'.",
          },
          relation: {
            type: "string",
            description:
              "Cómo se relaciona con este documento (ej: 'Se registra aquí la fuerza de remachado por lote', 'Deriva de este SOP', 'Se usa como entrada').",
          },
          frequency: {
            type: "string",
            description:
              "Con qué frecuencia se registra/usa (ej: 'cada pieza', 'por lote', 'por turno', 'diario'). Vacío si no aplica o aún se desconoce.",
          },
          reason: { type: "string", description: "Por qué se relaciona con este proceso." },
        },
        required: ["name", "type", "relation", "frequency", "reason"],
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

export type RelatedDocType =
  | "registro"
  | "checklist"
  | "formato"
  | "instructivo"
  | "sop"
  | "politica"
  | "analisis_riesgo"
  | "plan_inspeccion"
  | "otro";

export type Extraction = {
  process_name: string;
  summary: string;
  extracted: {
    field: string;
    value: string;
    category: string;
    confidence: string;
    is_critical: boolean;
  }[];
  questions: { field: string; question: string; why: string; is_critical: boolean }[];
  related_docs: {
    name: string;
    type: RelatedDocType;
    relation: string;
    frequency: string;
    reason: string;
  }[];
  still_missing: string[];
  ready_to_generate: boolean;
};
