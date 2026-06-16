// Redacta el CONTENIDO del documento (no un volcado de datos): secciones
// profesionales, pasos numerados y tablas, a partir de la conversación.
import { anthropic, BRAIN_MODEL } from "./client";
import type { DocContent } from "@/lib/docgen/types";
import { DocContentZ } from "./zod-schemas";

export type { DocContent };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Título del documento (el nombre del proceso/tema)." },
    sections: {
      type: "array",
      description: "Secciones del documento en orden de lectura.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: { type: "string" },
          kind: { type: "string", enum: ["text", "steps", "table"] },
          text: { type: "string", description: "Texto/prosa cuando kind=text. Vacío si no aplica." },
          steps: {
            type: "array",
            items: { type: "string" },
            description: "Pasos cuando kind=steps. Vacío si no aplica.",
          },
          columns: {
            type: "array",
            items: { type: "string" },
            description: "Encabezados de columna cuando kind=table. Vacío si no aplica.",
          },
          rows: {
            type: "array",
            description: "Filas cuando kind=table. Vacío si no aplica.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { cells: { type: "array", items: { type: "string" } } },
              required: ["cells"],
            },
          },
        },
        required: ["heading", "kind", "text", "steps", "columns", "rows"],
      },
    },
  },
  required: ["title", "sections"],
} as const;

// Guía de estructura por tipo de documento.
const STRUCTURE: Record<string, string> = {
  sop_mfg: `Secciones EXACTAS de un SOP de manufactura (formato ManualCore). Usa estos encabezados y columnas tal cual; incluye solo lo que aplique:
1. Propósito (text) — este SOP es la instrucción autorizada para la operación; toda desviación requiere autorización escrita del dueño del proceso.
2. Alcance y aplicabilidad (table: Campo | Detalle) con filas: Inicio del proceso, Fin del proceso, Exclusiones, Aplica a, Perfil de industria.
3. Requisitos operativos (5M) (table: M | Requisito | Método de verificación) con filas: Mano de obra, Máquina, Material, Método, Medición.
4. Seguridad y EPP (table: EPP requerido | Peligros de seguridad).
5. Pasos del proceso (table: OP | Paso | Descripción | Material/Herramienta (Nombre — SKU) | Parámetro crítico | Punto de control). Marca el punto de control con ✓ cuando aplique.
6. Especificaciones del producto/servicio (table: Característica | Nominal | Superior | Inferior | Unidad | Método de medición).
7. Documentos relacionados (table: Tipo | Título | N° de documento | Revisión).
(La aprobación se agrega automáticamente aparte.)`,
  sop_admin: `Secciones EXACTAS de un SOP administrativo / de servicios (formato ManualCore):
1. Propósito (text).
2. Alcance y aplicabilidad (table: Campo | Detalle): Inicio del proceso, Fin del proceso, Exclusiones, Aplica a.
3. Recursos operativos (table: Recurso | Detalle): Responsable, Herramientas y sistemas, Información requerida, Método, Indicador de calidad (KPI/SLA).
4. Cumplimiento y confidencialidad (table: Requisito | Detalle): Requisitos de cumplimiento, Nivel de confidencialidad.
5. Pasos del proceso (table: Paso | Descripción | Responsable/Herramienta | SLA/Resultado esperado | Punto de control).
6. Escalamiento y manejo de excepciones (table: Situación | Acción requerida | Escalar a).
7. Documentos relacionados (table: Tipo | Título | N° de documento | Revisión).`,
  inspection_plan: `Plan de inspección — principalmente UNA tabla (kind=table):
columns: Característica | Especificación (nominal/límites) | Método/Instrumento | Frecuencia | Plan de reacción.
Añade una sección Objetivo (text) breve al inicio.`,
  risk_analysis: `Análisis de riesgos — una sección Objetivo (text) y luego UNA tabla:
columns: Riesgo | Causa | Consecuencia | Controles actuales | Probabilidad (1-5) | Impacto (1-5) | Acción de mitigación.`,
  flowchart: `Describe el flujo como pasos (steps) en orden, marcando decisiones (Si/No) en el texto del paso.`,
  quality_policy: `Política de calidad — prosa (text): 1-3 párrafos con el compromiso de la empresa, mejora continua y cumplimiento de requisitos. Sección Objetivo y sección Declaración de la política.`,
  quality_objectives: `Objetivos de calidad — una tabla: Objetivo | Meta medible | Plazo | Responsable.`,
  qms_scope: `Alcance del SGC — prosa: a qué aplica, procesos incluidos, exclusiones con justificación, ubicaciones.`,
};

export async function generateDocumentContent(
  conversation: { role: "user" | "assistant"; content: string }[],
  templateCode: string,
  templateName: string,
  language: "es" | "en",
): Promise<DocContent | null> {
  const lang = language === "en" ? "English" : "español";
  const system = `Eres un redactor experto de documentación industrial. A partir de la CONVERSACIÓN entre el usuario y el asistente, redacta el documento final de tipo "${templateName}".

REGLAS:
- Usa ÚNICAMENTE la información que aparece en la conversación. NO inventes datos, cifras, nombres ni límites.
- Si falta un dato requerido, escribe "[Pendiente]" en su lugar — nunca lo inventes.
- Si el usuario pide "mejores prácticas", "complétalo", "mejóralo" o similar: esto NO te autoriza a inventar datos del proceso (cifras, límites, pasos, responsables, frecuencias, nombres). Solo puedes añadir buenas prácticas GENÉRICAS, universalmente válidas y lógicas (ej. "verificar el EPP antes de iniciar la operación"), y SIEMPRE marcadas como "[Sugerencia — validar con el responsable]". Si una práctica depende de este proceso y no la sabes, déjala como "[Pendiente]" — no la inventes.
- Cada frase debe sostenerse lógicamente para ESTE proceso. Nunca escribas algo que no tenga sentido o que no se desprenda de lo dicho. Ante la duda: omite o marca [Pendiente]. Inventar es peor que dejar un hueco.
- RESPETA LAS NEGACIONES: si el usuario dijo que algo NO existe o NO se usa (ej. "todo en el WMS, sin documentos de entrada/salida"), NO incluyas esa sección ni inventes su contenido. NUNCA contradigas lo que dijo.
- Las secciones de la guía de abajo son OPCIONALES: incluye SOLO las que apliquen a lo que el usuario describió; omite por completo las que no correspondan o que él haya excluido.
- Redacta de forma profesional y clara, como un documento real de empresa (no un volcado de "campo: valor").
- Procedimientos = pasos numerados (kind=steps). Parámetros/riesgos/inspecciones = tablas (kind=table). Explicaciones = prosa (kind=text).
- Para cada sección rellena solo el campo que corresponde a su kind; deja los otros vacíos ("", [] ).
- Responde TODO en ${lang}.

${STRUCTURE[templateCode] ?? "Organiza el documento en secciones lógicas y profesionales para este tipo."}`;

  try {
    const client = anthropic();
    const resp = await client.messages.create({
      model: BRAIN_MODEL,
      max_tokens: 16000,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      messages: conversation.length
        ? conversation
        : [{ role: "user", content: "Redacta el documento con la información disponible." }],
    });
    const block = resp.content.find((b) => b.type === "text");
    if (!block || !("text" in block)) return null;
    // Validación tolerante: garantiza la forma de las secciones.
    return DocContentZ.parse(JSON.parse(block.text)) as unknown as DocContent;
  } catch {
    return null;
  }
}
