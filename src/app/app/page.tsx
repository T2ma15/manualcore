import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STATE_LABELS: Record<string, string> = {
  draft: "Borrador",
  under_review: "En Revisión",
  approved: "Aprobado",
  released: "Publicado",
  obsolete: "Obsoleto",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, doc_type, status, doc_number, updated_at")
    .order("updated_at", { ascending: false })
    .limit(10);

  const docs = documents ?? [];
  const counts = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel</h1>
          <p className="text-[color:var(--mc-steel)] mt-1">
            Tus documentos formales, en un solo lugar.
          </p>
        </div>
        <Link
          href="/app/nuevo"
          className="rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-6 py-3 font-semibold hover:opacity-90"
        >
          + Nuevo documento
        </Link>
      </div>

      {/* Conteos por estado */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATE_LABELS).map(([key, label]) => (
          <div
            key={key}
            className="rounded-xl bg-white border border-[color:var(--mc-border)] px-4 py-4"
          >
            <p className="text-3xl font-bold text-[color:var(--mc-navy)]">
              {counts[key] ?? 0}
            </p>
            <p className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)] mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Lista reciente */}
      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-[color:var(--mc-steel)]">
        Documentos recientes
      </h2>

      {docs.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[color:var(--mc-border)] bg-white px-6 py-12 text-center">
          <p className="text-[color:var(--mc-steel)]">
            Aún no tienes documentos. Crea el primero — toma una tarde, no semanas.
          </p>
          <Link
            href="/app/nuevo"
            className="inline-block mt-4 rounded-full bg-[color:var(--mc-navy)] text-white px-6 py-3 font-semibold hover:opacity-90"
          >
            Empezar
          </Link>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-[color:var(--mc-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--mc-muted)] text-[color:var(--mc-steel)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t border-[color:var(--mc-border)]">
                  <td className="px-4 py-3">{d.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[color:var(--mc-steel)]">
                    {d.doc_number ?? "—"}
                  </td>
                  <td className="px-4 py-3">{STATE_LABELS[d.status] ?? d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
