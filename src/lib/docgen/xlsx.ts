import ExcelJS from "exceljs";
import { type DocData, groupBySection } from "./types";

const NAVY = "FF0D1F3C";
const TEAL = "FF15A888";
const LIGHT = "FFF1EDE4";
const GRAYTEXT = "FF5B6573";

export async function generateXlsx(data: DocData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ManualCore";
  const ws = wb.addWorksheet(data.templateName.slice(0, 28), {
    views: [{ showGridLines: false }],
  });
  ws.columns = [{ width: 4 }, { width: 38 }, { width: 60 }];

  const docId = data.docNumber ?? "BORRADOR";

  // Encabezado de marca
  ws.mergeCells("B2:C2");
  const company = ws.getCell("B2");
  company.value = data.tenantName;
  company.font = { name: "Arial", size: 16, bold: true, color: { argb: NAVY } };

  ws.mergeCells("B3:C3");
  const tname = ws.getCell("B3");
  tname.value = data.templateName;
  tname.font = { name: "Arial", size: 11, bold: true, color: { argb: TEAL } };

  // Meta
  const meta: [string, string][] = [
    ["Proceso", data.processName],
    ["Código", docId],
    ["Revisión", data.revision],
    ["Vigencia", data.effectiveDate ?? "—"],
    ["Próxima revisión", data.reviewDue ?? "—"],
    ["Elaboró", data.owner ?? "—"],
    ["Aprobó", data.approver ?? "—"],
  ];
  let r = 5;
  for (const [label, value] of meta) {
    const lc = ws.getCell(`B${r}`);
    lc.value = label;
    lc.font = { name: "Arial", size: 10, bold: true, color: { argb: GRAYTEXT } };
    const vc = ws.getCell(`C${r}`);
    vc.value = value;
    vc.font = { name: "Arial", size: 10 };
    r++;
  }

  r += 1;
  // Secciones
  for (const sec of groupBySection(data.extracted)) {
    ws.mergeCells(`B${r}:C${r}`);
    const h = ws.getCell(`B${r}`);
    h.value = sec.label;
    h.font = { name: "Arial", size: 11, bold: true, color: { argb: NAVY } };
    h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    r++;
    for (const it of sec.items) {
      const fc = ws.getCell(`B${r}`);
      fc.value = it.field;
      fc.font = { name: "Arial", size: 10, bold: true };
      fc.alignment = { vertical: "top", wrapText: true };
      const vc = ws.getCell(`C${r}`);
      vc.value = it.value;
      vc.font = { name: "Arial", size: 10 };
      vc.alignment = { vertical: "top", wrapText: true };
      r++;
    }
    r++;
  }

  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab);
}
