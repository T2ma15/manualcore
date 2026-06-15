import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_NAMES } from "@/lib/templates-guide";
import MatrizClient, { type Rel } from "./MatrizClient";

type DocRow = {
  id: string;
  title: string;
  doc_number: string | null;
  session_id: string | null;
  deleted_at: string | null;
  document_templates: { code?: string; name_es?: string } | null;
};

export default async function MatrizPage() {
  const supabase = await createClient();

  const { data: docsRaw } = await supabase
    .from("documents")
    .select("id, title, doc_number, session_id, deleted_at, document_templates(code, name_es)")
    .order("updated_at", { ascending: false });

  const docs = ((docsRaw ?? []) as unknown as DocRow[]).filter((d) => !d.deleted_at);
  const docMap = new Map(docs.map((d) => [d.id, d]));

  // Conteo de documentos activos por tipo (lista maestra resumida).
  const typeCounts = new Map<string, number>();
  for (const d of docs) {
    const code = d.document_templates?.code ?? "otro";
    const label = TEMPLATE_NAMES[code]?.es ?? d.document_templates?.name_es ?? "Documento";
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);
  }

  // Relaciones (best-effort: si la tabla aún no existe, lista vacía).
  let rels: Rel[] = [];
  try {
    const { data: relRows } = await supabase
      .from("document_relations")
      .select(
        "id, to_title, to_code, rel_type, relation, frequency, status, needs_review, review_reason, from_document_id, to_document_id",
      )
      .order("created_at", { ascending: true });
    rels = (relRows ?? []).map((r) => {
      const from = docMap.get(r.from_document_id as string);
      const to = r.to_document_id ? docMap.get(r.to_document_id as string) : undefined;
      return {
        id: r.id as string,
        to_title: (r.to_title as string) ?? "",
        to_code: (r.to_code as string | null) ?? to?.doc_number ?? null,
        rel_type: (r.rel_type as string) ?? "otro",
        relation: (r.relation as string | null) ?? null,
        frequency: (r.frequency as string | null) ?? null,
        status: (r.status as string) ?? "suggested",
        needs_review: Boolean(r.needs_review),
        review_reason: (r.review_reason as string | null) ?? null,
        from_title: from?.title ?? "Documento",
        from_code: from?.doc_number ?? null,
        to_session_id: to?.session_id ?? null,
      };
    });
  } catch {
    rels = [];
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link href="/app" className="text-sm text-[color:var(--mc-steel)] hover:underline">
        ← Volver al panel
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold tracking-tight">Matriz de referenciamiento</h1>
        <p className="text-[color:var(--mc-steel)] mt-1">
          Cómo se relacionan tus documentos y registros. Si cambia uno, aquí se marca cuál revisar.
        </p>
      </div>

      {typeCounts.size > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {[...typeCounts.entries()].map(([label, n]) => (
            <div
              key={label}
              className="rounded-xl bg-white border border-[color:var(--mc-border)] px-4 py-3"
            >
              <span className="text-xl font-bold text-[color:var(--mc-navy)]">{n}</span>{" "}
              <span className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)]">{label}</span>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-10 mb-4 text-sm font-semibold uppercase tracking-wide text-[color:var(--mc-steel)]">
        Documentos y registros relacionados
      </h2>
      <MatrizClient rels={rels} />
    </div>
  );
}
