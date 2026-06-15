/* eslint-disable @typescript-eslint/no-explicit-any */
// Flujograma ANSI con Graphviz (WASM, server-side). El cerebro entrega pasos;
// aquí se dibujan con formas ANSI: óvalo (inicio/fin), rectángulo (proceso),
// rombo (decisión). Devuelve HTML con el SVG embebido y la marca de la empresa.
import { type DocData } from "./types";

const NAVY = "#0D1F3C";
const TEAL = "#15A888";

let vizCached: any;
async function getViz(): Promise<any> {
  if (vizCached) return vizCached;
  const mod: any = await import("@viz-js/viz");
  vizCached = await mod.instance();
  return vizCached;
}

function esc(s: string): string {
  return String(s ?? "").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

// Parte el texto en líneas para que el nodo no quede gigante.
function wrap(s: string, n = 30): string {
  const words = esc(s).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > n) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.join("\\n");
}

function isDecision(s: string): boolean {
  return /\?|¿|\bs[ií]\s*\/\s*no\b/i.test(s);
}

function escHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function generateFlowchart(data: DocData): Promise<string> {
  // Prefiere los pasos redactados por el cerebro; si no, usa lo extraído.
  const fromSections = (data.sections ?? [])
    .filter((s): s is Extract<typeof s, { kind: "steps" }> => s.kind === "steps")
    .flatMap((s) => s.steps);
  const fromExtracted = data.extracted
    .filter((e) => e.category === "paso" || e.category === "operacion")
    .map((e) => (e.value ? `${e.field}: ${e.value}` : e.field));
  const pasos = fromSections.length ? fromSections : fromExtracted;
  const steps = pasos.length ? pasos : [data.processName];

  const docId = data.docNumber ?? "BORRADOR";

  const lines: string[] = [];
  lines.push("digraph G {");
  lines.push('  rankdir=TB; bgcolor="transparent"; pad=0.2; nodesep=0.35; ranksep=0.45;');
  lines.push(
    `  node [fontname="Arial", fontsize=11, style="filled", color="${TEAL}", fillcolor="white", fontcolor="#1F2933", margin="0.18,0.10"];`,
  );
  lines.push(`  edge [color="${TEAL}", penwidth=1.2, arrowsize=0.8];`);

  lines.push(`  n_start [label="Inicio", shape=ellipse, fillcolor="${NAVY}", fontcolor="white", color="${NAVY}"];`);
  steps.forEach((s, i) => {
    const shape = isDecision(s) ? "diamond" : "box";
    lines.push(`  n${i} [label="${wrap(s)}", shape=${shape}];`);
  });
  lines.push(`  n_end [label="Fin", shape=ellipse, fillcolor="${NAVY}", fontcolor="white", color="${NAVY}"];`);

  // Aristas en secuencia.
  const seq = ["n_start", ...steps.map((_, i) => `n${i}`), "n_end"];
  for (let i = 0; i < seq.length - 1; i++) lines.push(`  ${seq[i]} -> ${seq[i + 1]};`);
  lines.push("}");
  const dot = lines.join("\n");

  let svg = "";
  const viz = await getViz();
  svg = viz.renderString(dot, { format: "svg" });
  // Hace el SVG responsive (quita ancho/alto fijos).
  svg = svg.replace(/<svg ([^>]*?)width="[^"]*"\s*height="[^"]*"/, '<svg $1');

  const logo = data.logoDataUrl
    ? `<img src="${escHtml(data.logoDataUrl)}" alt="logo" style="max-height:56px;margin-bottom:12px;">`
    : "";

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${escHtml(data.processName)} — Flujograma</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;background:#f7f8fa;color:#1F2933;margin:0;padding:32px;}
.wrap{max-width:880px;margin:0 auto;background:#fff;border:1px solid #e7eaef;border-radius:12px;padding:28px;}
h1{color:${NAVY};font-size:22px;margin:0 0 4px;}
.muted{color:#5B6573;font-size:13px;margin:0 0 20px;}
.chart{width:100%;overflow:auto;text-align:center;}
.chart svg{max-width:100%;height:auto;}
.foot{margin-top:24px;text-align:center;color:#5B6573;font-size:12px;border-top:1px solid #e7eaef;padding-top:12px;}
</style></head>
<body><div class="wrap">
${logo}
<h1>${escHtml(data.processName)}</h1>
<p class="muted">${escHtml(data.tenantName)} · ${escHtml(data.templateName)} · ${escHtml(docId)} · ${escHtml(data.revision)}</p>
<div class="chart">${svg}</div>
<p class="foot">${escHtml(data.tenantName)} · ${escHtml(docId)} · ${escHtml(data.revision)} — Óvalo: inicio/fin · Rectángulo: actividad · Rombo: decisión</p>
</div></body></html>`;
}
