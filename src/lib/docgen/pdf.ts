/* eslint-disable @typescript-eslint/no-explicit-any */
// Generador de PDF con pie de TRAZABILIDAD DE IMPRESIÓN (quién imprimió, copia #,
// fecha, página, "COPIA NO CONTROLADA"). Usa pdfmake (JS puro, sin Chromium).
import {
  type DocData,
  parseDataUrl,
  RELATED_TYPE_LABEL,
  RELATED_STATUS_LABEL,
} from "./types";

const NAVY = "#0D1F3C";
const TEAL = "#15A888";
const GRAY = "#5B6573";
const LIGHT = "#E7EAEF";

export type PrintMeta = { printedBy: string; printedAt: string; copyNumber: number };

let cached: any;
async function getPdfMake(): Promise<any> {
  if (cached) return cached;
  const mk: any = (await import("pdfmake/build/pdfmake")).default ?? (await import("pdfmake/build/pdfmake"));
  const fonts: any =
    (await import("pdfmake/build/vfs_fonts")).default ?? (await import("pdfmake/build/vfs_fonts"));
  mk.vfs = fonts.pdfMake?.vfs ?? fonts.vfs ?? mk.vfs;
  cached = mk;
  return mk;
}

const borderLayout = {
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => LIGHT,
  vLineColor: () => LIGHT,
  paddingTop: () => 4,
  paddingBottom: () => 4,
  paddingLeft: () => 6,
  paddingRight: () => 6,
};

export async function generatePdf(data: DocData, print: PrintMeta): Promise<Buffer> {
  const pdfMake = await getPdfMake();
  const isDraft = !data.docNumber;
  const docId = data.docNumber ?? "BORRADOR";
  const content: any[] = [];

  const logo = parseDataUrl(data.logoDataUrl);
  if (logo && logo.ext !== "gif") {
    content.push({ image: data.logoDataUrl, fit: [150, 56], margin: [0, 0, 0, 8] });
  }

  content.push({ text: data.tenantName, color: NAVY, bold: true, fontSize: 16 });
  content.push({ text: data.templateName, color: TEAL, bold: true, fontSize: 11, margin: [0, 0, 0, 8] });
  if (isDraft) {
    content.push({ text: "BORRADOR — no controlado", color: "#B3261E", bold: true, margin: [0, 0, 0, 8] });
  }
  content.push({ text: data.processName, color: NAVY, bold: true, fontSize: 18, margin: [0, 4, 0, 10] });

  // Encabezado de control documental
  const meta: [string, string][] = [
    ["Empresa", data.tenantName],
    ["Documento", data.templateName],
    ["Proceso", data.processName],
    ["Código", docId],
    ["Revisión", data.revision],
    ["Fecha de vigencia", data.effectiveDate ?? "—"],
    ["Próxima revisión", data.reviewDue ?? "—"],
  ];
  content.push({
    table: {
      widths: [120, "*"],
      body: meta.map(([k, v]) => [
        { text: k, bold: true, color: GRAY, fontSize: 9 },
        { text: v || "—", fontSize: 9 },
      ]),
    },
    layout: borderLayout,
    margin: [0, 0, 0, 14],
  });

  const heading = (t: string) => ({ text: t, color: NAVY, bold: true, fontSize: 12, margin: [0, 12, 0, 5] });

  // Secciones redactadas por el cerebro
  const sections = data.sections ?? [];
  for (const sec of sections) {
    content.push(heading(sec.heading));
    if (sec.kind === "steps") {
      content.push({ ol: sec.steps.map((s) => ({ text: s, fontSize: 10, margin: [0, 1, 0, 1] })) });
    } else if (sec.kind === "table") {
      content.push({
        table: {
          headerRows: 1,
          widths: sec.columns.map(() => "*"),
          body: [
            sec.columns.map((c) => ({ text: c, bold: true, color: NAVY, fillColor: LIGHT, fontSize: 9 })),
            ...sec.rows.map((r) => r.cells.map((v) => ({ text: v ?? "", fontSize: 9 }))),
          ],
        },
        layout: borderLayout,
      });
    } else {
      content.push({ text: sec.text, fontSize: 10 });
    }
  }

  // Documentos y registros relacionados (matriz de referenciamiento)
  if (data.relatedDocs && data.relatedDocs.length) {
    content.push(heading("Documentos y registros relacionados"));
    content.push({
      table: {
        headerRows: 1,
        widths: ["*", 70, "*", 60, 50],
        body: [
          ["Documento", "Tipo", "Relación / qué se registra", "Frecuencia", "Estado"].map((c) => ({
            text: c,
            bold: true,
            color: NAVY,
            fillColor: LIGHT,
            fontSize: 9,
          })),
          ...data.relatedDocs.map((r) => [
            { text: r.code ? `${r.title} (${r.code})` : r.title, fontSize: 9 },
            { text: RELATED_TYPE_LABEL[r.type] ?? "Documento", fontSize: 9 },
            { text: r.relation, fontSize: 9 },
            { text: r.frequency || "—", fontSize: 9 },
            { text: RELATED_STATUS_LABEL[r.status] ?? "", fontSize: 9 },
          ]),
        ],
      },
      layout: borderLayout,
    });
  }

  // Aprobación
  content.push(heading("Aprobación"));
  content.push({
    table: {
      widths: ["*", "*"],
      body: [
        [
          { text: "Elaboró", bold: true, color: GRAY, fontSize: 9 },
          { text: "Aprobó", bold: true, color: GRAY, fontSize: 9 },
        ],
        [
          { text: data.owner ?? "—", fontSize: 9 },
          { text: data.approver ?? "—", fontSize: 9 },
        ],
      ],
    },
    layout: borderLayout,
  });

  const controlLabel = "COPIA NO CONTROLADA AL IMPRIMIR";

  const docDefinition: any = {
    info: { title: `${data.templateName} — ${data.processName}`, creator: "ManualCore" },
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { fontSize: 10, color: "#1F2933" },
    content,
    footer: (currentPage: number, pageCount: number) => ({
      margin: [40, 8, 40, 0],
      columns: [
        { text: `${data.tenantName} · ${docId} · ${data.revision}`, fontSize: 7, color: GRAY, width: "*" },
        { text: controlLabel, fontSize: 7, color: GRAY, alignment: "center", width: "auto" },
        {
          text: `Impreso por ${print.printedBy} · ${print.printedAt} · Copia #${print.copyNumber} · Pág ${currentPage}/${pageCount}`,
          fontSize: 7,
          color: GRAY,
          alignment: "right",
          width: "*",
        },
      ],
    }),
  };

  return await new Promise<Buffer>((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBuffer((buf: Buffer) => resolve(Buffer.from(buf)));
    } catch (e) {
      reject(e);
    }
  });
}
