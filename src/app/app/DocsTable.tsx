"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Doc = {
  id: string;
  title: string;
  status: string;
  doc_number: string | null;
  session_id: string | null;
  review_due: string | null;
  deleted_at: string | null;
};

const STATE_LABELS: Record<string, string> = {
  draft: "Borrador",
  under_review: "En revisión",
  approved: "Aprobado",
  released: "Publicado",
  obsolete: "Obsoleto",
};

export default function DocsTable({ active, trashed }: { active: Doc[]; trashed: Doc[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  async function act(documentId: string, action: "delete" | "recover") {
    if (action === "delete" && !confirm("¿Enviar este documento a la papelera? Podrás recuperarlo 30 días.")) return;
    setBusy(documentId);
    try {
      await fetch("/api/document/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, action }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[color:var(--mc-border)] bg-white px-6 py-12 text-center">
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
        <div className="overflow-hidden rounded-xl border border-[color:var(--mc-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--mc-muted)] text-[color:var(--mc-steel)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Documento</th>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Próx. revisión</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {active.map((d) => {
                const overdue =
                  d.review_due && d.review_due < today && (d.status === "approved" || d.status === "released");
                return (
                  <tr key={d.id} className="border-t border-[color:var(--mc-border)]">
                    <td className="px-4 py-3">{d.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[color:var(--mc-steel)]">
                      {d.doc_number ?? "—"}
                    </td>
                    <td className="px-4 py-3">{STATE_LABELS[d.status] ?? d.status}</td>
                    <td className="px-4 py-3">
                      {d.review_due ? (
                        <span className={overdue ? "text-red-600 font-semibold" : ""}>
                          {d.review_due}
                          {overdue ? " · vencida" : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {d.session_id && (
                        <Link
                          href={`/app/sesion/${d.session_id}`}
                          className="text-[color:var(--mc-teal)] font-semibold hover:underline mr-3"
                        >
                          Abrir
                        </Link>
                      )}
                      <button
                        onClick={() => act(d.id, "delete")}
                        disabled={busy === d.id}
                        className="text-[color:var(--mc-steel)] hover:text-red-600 disabled:opacity-50"
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {trashed.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowTrash((s) => !s)}
            className="text-sm text-[color:var(--mc-steel)] hover:underline"
          >
            {showTrash ? "▾" : "▸"} Papelera ({trashed.length}) — se eliminan a los 30 días
          </button>
          {showTrash && (
            <div className="mt-2 overflow-hidden rounded-xl border border-[color:var(--mc-border)] bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {trashed.map((d) => {
                    const left = d.deleted_at
                      ? Math.max(0, 30 - Math.floor((Date.now() - new Date(d.deleted_at).getTime()) / 86400000))
                      : 30;
                    return (
                      <tr key={d.id} className="border-t border-[color:var(--mc-border)] first:border-t-0">
                        <td className="px-4 py-3 text-[color:var(--mc-steel)] line-through">{d.title}</td>
                        <td className="px-4 py-3 text-xs text-[color:var(--mc-steel)]">
                          se elimina en {left} día{left === 1 ? "" : "s"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => act(d.id, "recover")}
                            disabled={busy === d.id}
                            className="text-[color:var(--mc-teal)] font-semibold hover:underline disabled:opacity-50"
                          >
                            Recuperar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
