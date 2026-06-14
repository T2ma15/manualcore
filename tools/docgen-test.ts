import { writeFileSync } from "fs";
import { generateDocx } from "../src/lib/docgen/docx";
import { generateXlsx } from "../src/lib/docgen/xlsx";
import type { DocData } from "../src/lib/docgen/types";

const TEST_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const base: DocData = {
  tenantName: "Industrias Quisqueya SRL",
  logoDataUrl: TEST_LOGO,
  templateCode: "sop_mfg",
  templateName: "SOP — Manufactura",
  processName: "Ensamble de tapa con riveteadora",
  docNumber: null,
  revision: "REV00",
  status: "draft",
  effectiveDate: null,
  reviewDue: "2027-06-14",
  owner: "Juan Pérez",
  approver: "María Díaz",
  extracted: [
    { field: "Operación 1", value: "Ensamble de tapa con riveteadora neumática", category: "operacion" },
    { field: "Paso 1", value: "Colocar la tapa sobre la base", category: "paso" },
    { field: "Paso 2", value: "Alinear los dos agujeros", category: "paso" },
    { field: "Paso 3", value: "Aplicar el remache", category: "paso" },
    { field: "Material", value: "Remache de aluminio SKU RA-450", category: "material" },
    { field: "Parámetro crítico - fuerza", value: "450 N ± 20", category: "especificacion" },
    { field: "EPP", value: "Lentes de seguridad, guantes, protección auditiva", category: "seguridad" },
    { field: "Responsable", value: "Juan Pérez, línea 3", category: "responsable" },
  ],
};

async function main() {
  const docx = await generateDocx(base);
  writeFileSync("tools/_out_sop.docx", docx);

  const xlsx = await generateXlsx({
    ...base,
    templateCode: "inspection_plan",
    templateName: "Plan de Inspección de Calidad",
  });
  writeFileSync("tools/_out_plan.xlsx", xlsx);

  const pk = (b: Buffer) => b[0] === 0x50 && b[1] === 0x4b; // "PK" = ZIP/Office válido
  console.log("DOCX:", docx.length, "bytes ·", pk(docx) ? "válido ✓" : "INVÁLIDO");
  console.log("XLSX:", xlsx.length, "bytes ·", pk(xlsx) ? "válido ✓" : "INVÁLIDO");
}
main();
