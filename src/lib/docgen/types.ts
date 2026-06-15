// Datos normalizados que consumen los generadores de documentos.
export type DocField = { field: string; value: string; category: string };

// Contenido redactado por el cerebro (secciones profesionales).
export type DocSection =
  | { heading: string; kind: "text"; text: string }
  | { heading: string; kind: "steps"; steps: string[] }
  | { heading: string; kind: "table"; columns: string[]; rows: { cells: string[] }[] };

export type DocContent = { title: string; sections: DocSection[] };

// Documento o registro relacionado con éste (matriz de referenciamiento).
export type RelatedDoc = {
  title: string;
  type: string; // registro, checklist, sop, formato, politica, analisis_riesgo, plan_inspeccion, instructivo, otro
  relation: string; // cómo se conecta (ej: "Se registra aquí la fuerza por lote")
  frequency: string | null; // cada cuánto se registra/usa
  code: string | null; // código si ya existe en el sistema
  status: "existing" | "suggested" | "created"; // ya existe / sugerido por crear / creado por ManualCore
};

// Etiqueta legible por tipo de documento relacionado.
export const RELATED_TYPE_LABEL: Record<string, string> = {
  registro: "Registro",
  checklist: "Checklist",
  formato: "Formato",
  instructivo: "Instructivo",
  sop: "SOP",
  politica: "Política",
  analisis_riesgo: "Análisis de riesgo",
  plan_inspeccion: "Plan de inspección",
  otro: "Documento",
};

// Etiqueta legible por estado del documento relacionado.
export const RELATED_STATUS_LABEL: Record<string, string> = {
  existing: "Ya existe",
  suggested: "Por crear",
  created: "Creado",
};

export type DocData = {
  tenantName: string;
  logoDataUrl: string | null; // data:image/...;base64,... — logo del cliente
  templateCode: string;
  templateName: string; // nombre en español
  processName: string;
  docNumber: string | null; // null hasta aprobar → "BORRADOR"
  revision: string; // "REV00"
  status: string;
  effectiveDate: string | null;
  reviewDue: string | null;
  owner: string | null;
  approver: string | null;
  extracted: DocField[];
  sections: DocSection[] | null; // contenido redactado; si null se usa `extracted`
  relatedDocs?: RelatedDoc[]; // matriz de referenciamiento: registros y documentos enlazados
};

// Parsea un data URL (data:image/png;base64,...) a sus partes.
export function parseDataUrl(
  dataUrl: string | null,
): { buffer: Buffer; base64: string; ext: "png" | "jpg" | "gif"; mime: string } | null {
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:(image\/(png|jpeg|jpg|gif));base64,(.+)$/);
  if (!m) return null;
  const mime = m[1];
  const raw = m[2];
  const ext = raw === "jpeg" || raw === "jpg" ? "jpg" : raw === "gif" ? "gif" : "png";
  const base64 = m[3];
  return { buffer: Buffer.from(base64, "base64"), base64, ext, mime };
}

// Etiqueta de sección por categoría del brain (orden de presentación).
export const SECTION_ORDER: { key: string; label: string }[] = [
  { key: "operacion", label: "Procedimiento" },
  { key: "paso", label: "Procedimiento" },
  { key: "material", label: "Materiales e insumos" },
  { key: "especificacion", label: "Especificaciones y parámetros críticos" },
  { key: "seguridad", label: "Seguridad y equipo de protección (EPP)" },
  { key: "riesgo", label: "Riesgos" },
  { key: "responsable", label: "Responsables" },
  { key: "otro", label: "Información adicional" },
];

// Agrupa los campos extraídos en secciones, respetando el orden.
export function groupBySection(fields: DocField[]): { label: string; items: DocField[] }[] {
  const labels = [...new Set(SECTION_ORDER.map((s) => s.label))];
  const byLabel = new Map<string, DocField[]>();
  for (const label of labels) byLabel.set(label, []);
  const labelOf = (cat: string) =>
    SECTION_ORDER.find((s) => s.key === cat)?.label ?? "Información adicional";
  for (const f of fields) byLabel.get(labelOf(f.category))!.push(f);
  return labels
    .map((label) => ({ label, items: byLabel.get(label)! }))
    .filter((s) => s.items.length > 0);
}
