import { type DocData } from "./types";

// Flujograma vertical simple (HTML+SVG) a partir de los pasos extraídos.
// V0: flujo lineal limpio; los rombos de decisión llegan en V1.
export function generateHtml(data: DocData): string {
  // Prefiere los pasos redactados por el cerebro; si no, usa lo extraído.
  const fromSections = (data.sections ?? [])
    .filter((s): s is Extract<typeof s, { kind: "steps" }> => s.kind === "steps")
    .flatMap((s) => s.steps.map((t) => ({ field: t, value: "", category: "paso" })));
  const pasos =
    fromSections.length > 0
      ? fromSections
      : data.extracted.filter((e) => e.category === "paso" || e.category === "operacion");
  const items = pasos.length ? pasos : data.extracted;
  const docId = data.docNumber ?? "BORRADOR";

  const boxes = items
    .map((it, i) => {
      const isStart = i === 0;
      const isEnd = i === items.length - 1;
      const shape = isStart || isEnd ? "border-radius:24px;" : "border-radius:8px;";
      const bg = isStart || isEnd ? "#0D1F3C;color:#fff;" : "#ffffff;color:#1F2933;border:1.5px solid #15A888;";
      const arrow = isEnd
        ? ""
        : '<div style="width:2px;height:26px;background:#15A888;margin:0 auto;"></div><div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #15A888;margin:0 auto;"></div>';
      return `<div style="${shape}${bg}padding:14px 18px;max-width:520px;margin:0 auto;font-size:14px;box-shadow:0 1px 2px rgba(13,31,60,.06);">
        <strong>${esc(it.field)}</strong>${it.value ? ` — ${esc(it.value)}` : ""}
      </div>${arrow}`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${esc(data.processName)} — Flujograma</title>
<style>body{font-family:Arial,Helvetica,sans-serif;background:#f7f8fa;color:#1F2933;margin:0;padding:32px;}
.wrap{max-width:680px;margin:0 auto;background:#fff;border:1px solid #e7eaef;border-radius:12px;padding:28px;}
h1{color:#0D1F3C;font-size:22px;margin:0 0 4px;}.muted{color:#5B6573;font-size:13px;margin:0 0 24px;}
.flow>div{margin-bottom:0;}.foot{margin-top:28px;text-align:center;color:#5B6573;font-size:12px;}</style></head>
<body><div class="wrap">
${data.logoDataUrl ? `<img src="${esc(data.logoDataUrl)}" alt="logo" style="max-height:56px;margin-bottom:14px;">` : ""}
<h1>${esc(data.processName)}</h1>
<p class="muted">${esc(data.tenantName)} · ${esc(data.templateName)} · ${esc(docId)} · ${esc(data.revision)}</p>
<div class="flow">${boxes}</div>
<p class="foot">${esc(data.tenantName)} · ${esc(docId)} · ${esc(data.revision)}</p>
</div></body></html>`;
}

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
