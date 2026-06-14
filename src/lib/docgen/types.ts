// Datos normalizados que consumen los generadores de documentos.
export type DocField = { field: string; value: string; category: string };

export type DocData = {
  tenantName: string;
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
};

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
