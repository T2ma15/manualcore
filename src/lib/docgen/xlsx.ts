import ExcelJS from "exceljs";
import { type DocData, groupBySection, parseDataUrl } from "./types";

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
  const logo = parseDataUrl(data.logoDataUrl);

  // Logo (arriba a la izquierda); el contenido empieza más abajo si hay logo.
  let row = 2;
  if (logo) {
    const imgId = wb.addImage({
      base64: logo.base64,
      extension: logo.ext === "jpg" ? "jpeg" : (logo.ext as "png" | "gif"),
    });
    ws.addImage(imgId, { tl: { col: 1, row: 0.3 }, ext: { width: 140, height: 56 } });
    row = 5;
  }

  ws.mergeCells(`B${row}:C${row}`);
  const company = ws.getCell(`B${row}`);
  company.value = data.tenantName;
  company.font = { name: "Arial", size: 16, bold: true, color: { argb: NAVY } };
  row++;

  ws.mergeCells(`B${row}:C${row}`);
  const tname = ws.getCell(`B${row}`);
  tname.value = data.templateName;
  tname.font = { name: "Arial", size: 11, bold: true, color: { argb: TEAL } };
  row += 2;

  const meta: [string, string][] = [
    ["Proceso", data.processName],
    ["Código", docId],
    ["Revisión", data.revision],
    ["Vigencia", data.effectiveDate ?? "—"],
    ["Próxima revisión", data.reviewDue ?? "—"],
    ["Elaboró", data.owner ?? "—"],
    ["Aprobó", data.approver ?? "—"],
  ];
  for (const [label, value] of meta) {
    const lc = ws.getCell(`B${row}`);
    lc.value = label;
    lc.font = { name: "Arial", size: 10, bold: true, color: { argb: GRAYTEXT } };
    const vc = ws.getCell(`C${row}`);
    vc.value = value;
    vc.font = { name: "Arial", size: 10 };
    row++;
  }
  row++;

  for (const sec of groupBySection(data.extracted)) {
    ws.mergeCells(`B${row}:C${row}`);
    const h = ws.getCell(`B${row}`);
    h.value = sec.label;
    h.font = { name: "Arial", size: 11, bold: true, color: { argb: NAVY } };
    h.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
    row++;
    for (const it of sec.items) {
      const fc = ws.getCell(`B${row}`);
      fc.value = it.field;
      fc.font = { name: "Arial", size: 10, bold: true };
      fc.alignment = { vertical: "top", wrapText: true };
      const vc = ws.getCell(`C${row}`);
      vc.value = it.value;
      vc.font = { name: "Arial", size: 10 };
      vc.alignment = { vertical: "top", wrapText: true };
      row++;
    }
    row++;
  }

  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab);
}
