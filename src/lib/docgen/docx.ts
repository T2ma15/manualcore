import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
} from "docx";
import { type DocData, groupBySection, parseDataUrl } from "./types";

const NAVY = "0D1F3C";
const TEAL = "15A888";
const GRAY = "5B6573";
const LIGHT = "E7EAEF";

function cell(text: string, opts: { bold?: boolean; color?: string; width?: number } = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold: opts.bold, color: opts.color ?? "1F2933", size: 20 }),
        ],
      }),
    ],
  });
}

function metaRow(label: string, value: string) {
  return new TableRow({
    children: [
      cell(label, { bold: true, color: GRAY, width: 30 }),
      cell(value || "—", { width: 70 }),
    ],
  });
}

export async function generateDocx(data: DocData): Promise<Buffer> {
  const isDraft = !data.docNumber;
  const docId = data.docNumber ?? "BORRADOR";

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      left: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      right: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
    },
    rows: [
      metaRow("Empresa", data.tenantName),
      metaRow("Documento", data.templateName),
      metaRow("Proceso", data.processName),
      metaRow("Código", docId),
      metaRow("Revisión", data.revision),
      metaRow("Fecha de vigencia", data.effectiveDate ?? "—"),
      metaRow("Próxima revisión", data.reviewDue ?? "—"),
    ],
  });

  const heading = (t: string) =>
    new Paragraph({
      spacing: { before: 280, after: 120 },
      children: [new TextRun({ text: t, bold: true, color: NAVY, size: 24 })],
    });

  function dataTable(columns: string[], rows: string[][]) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
        left: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
        right: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      },
      rows: [
        new TableRow({
          tableHeader: true,
          children: columns.map((c) => cell(c, { bold: true, color: NAVY })),
        }),
        ...rows.map((r) => new TableRow({ children: r.map((v) => cell(v ?? "")) })),
      ],
    });
  }

  let sectionBlocks: (Paragraph | Table)[];
  if (data.sections && data.sections.length) {
    sectionBlocks = data.sections.flatMap((sec): (Paragraph | Table)[] => {
      const out: (Paragraph | Table)[] = [heading(sec.heading)];
      if (sec.kind === "steps") {
        sec.steps.forEach((s, i) =>
          out.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({ text: `${i + 1}. `, bold: true, color: TEAL, size: 20 }),
                new TextRun({ text: s, color: "1F2933", size: 20 }),
              ],
            }),
          ),
        );
      } else if (sec.kind === "table") {
        out.push(dataTable(sec.columns, sec.rows.map((r) => r.cells)));
      } else {
        out.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: sec.text, color: "1F2933", size: 20 })],
          }),
        );
      }
      return out;
    });
  } else {
    sectionBlocks = groupBySection(data.extracted).flatMap((sec): (Paragraph | Table)[] => [
      heading(sec.label),
      ...sec.items.map(
        (it) =>
          new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: `${it.field}: `, bold: true, color: "1F2933", size: 20 }),
              new TextRun({ text: it.value, color: "1F2933", size: 20 }),
            ],
          }),
      ),
    ]);
  }

  const approval = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      left: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      right: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LIGHT },
    },
    rows: [
      new TableRow({
        children: [
          cell("Elaboró", { bold: true, color: GRAY, width: 50 }),
          cell("Aprobó", { bold: true, color: GRAY, width: 50 }),
        ],
      }),
      new TableRow({
        children: [cell(data.owner ?? "—", { width: 50 }), cell(data.approver ?? "—", { width: 50 })],
      }),
    ],
  });

  const logo = parseDataUrl(data.logoDataUrl);
  const children: (Paragraph | Table)[] = [];

  if (logo) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new ImageRun({
            data: logo.buffer,
            type: logo.ext === "jpg" ? "jpg" : logo.ext === "gif" ? "gif" : "png",
            transformation: { width: 150, height: 60 },
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: data.tenantName, bold: true, color: NAVY, size: 28 })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: data.templateName, color: TEAL, size: 22, bold: true })],
    }),
  );

  if (isDraft) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: "BORRADOR — no controlado",
            bold: true,
            color: "B3261E",
            size: 20,
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [new TextRun({ text: data.processName, bold: true, color: NAVY, size: 32 })],
    }),
    headerTable,
    ...sectionBlocks,
    new Paragraph({
      spacing: { before: 320, after: 120 },
      children: [new TextRun({ text: "Aprobación", bold: true, color: NAVY, size: 24 })],
    }),
    approval,
    new Paragraph({
      spacing: { before: 320 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${data.tenantName} · ${docId} · ${data.revision}`,
          color: GRAY,
          size: 16,
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "ManualCore",
    title: `${data.templateName} — ${data.processName}`,
    styles: {
      default: { document: { run: { font: "Arial", size: 20, color: "1F2933" } } },
    },
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
