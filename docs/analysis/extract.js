// Extracts text from ManualCore xlsx (matrices) and docx (spec) without external deps.
// xlsx/docx are zip files; Node 24 lacks built-in unzip, so we shell out to PowerShell Expand-Archive first.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = __dirname;
const TMP = path.join(OUT, "_tmp");

function unzip(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const zipCopy = dest + ".zip";
  fs.copyFileSync(src, zipCopy);
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy}' -DestinationPath '${dest}' -Force"`,
    { stdio: "pipe" }
  );
  fs.rmSync(zipCopy, { force: true });
}

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

// ---------- XLSX ----------
function extractXlsx(src, outName) {
  const dir = path.join(TMP, path.basename(src, ".xlsx"));
  unzip(src, dir);

  // shared strings
  const ssPath = path.join(dir, "xl", "sharedStrings.xml");
  let shared = [];
  if (fs.existsSync(ssPath)) {
    const ss = fs.readFileSync(ssPath, "utf8");
    shared = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
      decodeEntities([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""))
    );
  }

  // sheet names from workbook.xml
  const wb = fs.readFileSync(path.join(dir, "xl", "workbook.xml"), "utf8");
  const sheetNames = [...wb.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="rId(\d+)"/g)];
  // map rId -> file via rels
  const rels = fs.readFileSync(path.join(dir, "xl", "_rels", "workbook.xml.rels"), "utf8");
  const relMap = {};
  for (const m of rels.matchAll(/<Relationship[^>]*Id="rId(\d+)"[^>]*Target="([^"]*)"/g)) {
    relMap[m[1]] = m[2];
  }

  let out = "";
  for (const [, name, rid] of sheetNames) {
    const target = relMap[rid];
    if (!target || !target.includes("worksheets")) continue;
    const sheetFile = path.join(dir, "xl", target.replace(/^\//, ""));
    if (!fs.existsSync(sheetFile)) continue;
    const xml = fs.readFileSync(sheetFile, "utf8");
    out += `\n\n===== SHEET: ${name} =====\n`;
    for (const row of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const c of row[2].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
        const attrs = c[1];
        const colM = attrs.match(/r="([A-Z]+)\d+"/);
        const typeM = attrs.match(/t="([^"]*)"/);
        const col = colM ? colM[1] : "?";
        const type = typeM ? typeM[1] : "";
        let val = "";
        const v = c[2].match(/<v>([\s\S]*?)<\/v>/);
        const is = c[2].match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/);
        if (is) val = decodeEntities(is[1]);
        else if (v) val = type === "s" ? shared[+v[1]] ?? "" : decodeEntities(v[1]);
        if (val !== "") cells.push(`${col}: ${val}`);
      }
      if (cells.length) out += `Row ${row[1]} | ${cells.join(" | ")}\n`;
    }
  }
  fs.writeFileSync(path.join(OUT, outName), out.trim(), "utf8");
  console.log(`${outName}: ${out.length} chars`);
}

// ---------- DOCX ----------
function extractDocx(src, outName) {
  const dir = path.join(TMP, path.basename(src, ".docx"));
  unzip(src, dir);
  const xml = fs.readFileSync(path.join(dir, "word", "document.xml"), "utf8");
  let text = "";
  // paragraphs
  for (const p of xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const runs = [...p[0].matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((t) => decodeEntities(t[1]));
    const line = runs.join("");
    text += line + "\n";
  }
  fs.writeFileSync(path.join(OUT, outName), text.trim(), "utf8");
  console.log(`${outName}: ${text.length} chars`);
}

const DL = "C:\\Users\\tmate\\Downloads";
extractXlsx(path.join(DL, "ManualCore_Database_Schema.xlsx"), "schema_matrices.txt");
extractDocx(path.join(DL, "ManualCore_Design_Specification_v2.docx"), "spec_v2.txt");
extractDocx(path.join(DL, "ManualCore_SOP_Template_v2.docx"), "sop_template_v2.txt");
extractDocx(path.join(DL, "ManualCore_WI_Template_v3.docx"), "wi_template_v3.txt");
fs.rmSync(TMP, { recursive: true, force: true });
console.log("done");
