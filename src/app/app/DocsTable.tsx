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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [selTrash, setSelTrash] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  async function run(documentIds: string[], action: "delete" | "recover") {
    if (busy || documentIds.length === 0) return;
    if (
      action === "delete" &&
      !confirm(
        documentIds.length === 1
          ? "¿Enviar este documento a la papelera? Podrás recuperarlo 30 días."
          : `¿Enviar ${documentIds.length} documentos a la papelera? Podrás recuperarlos 30 días.`,
      )
    )
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/document/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds, action }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((d as { error?: string }).error ?? "No se pudo procesar.");
      setSel(new Set());
      setSelTrash(new Set());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar.");
    } finally {
      setBusy(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const allSelected = active.length > 0 && sel.size === active.length;

  return (
    <div>
      {error && (
        <p className="mb-3 text-[12.5px] text-[#B3261E] bg-[#FCEDED] border border-[#F2D6D6] rounded-[10px] px-3.5 py-2.5">
          {error}
        </p>
      )}

      {/* Barra de acciones de multiselección */}
      {sel.size > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap rounded-[10px] border border-[color:var(--mc-border)] bg-[color:var(--mc-muted)] px-4 py-2.5">
          <span className="text-[13px] text-[color:var(--mc-ink)]">
            <span className="font-semibold">{sel.size}</span> seleccionado{sel.size === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSel(new Set())}
              className="text-[13px] text-[color:var(--mc-steel)] hover:underline"
            >
              Cancelar
            </button>
            <button
              onClick={() => run([...sel], "delete")}
              disabled={busy}
              className="rounded-[8px] bg-[color:var(--mc-navy)] text-white px-4 py-1.5 text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Borrando…" : "Borrar seleccionados"}
            </button>
          </div>
        </div>
      )}

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
          <table className="w-full text-[13px]">
            <thead className="bg-[color:var(--mc-muted)] text-[color:var(--mc-steel)] text-left">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = sel.size > 0 && !allSelected;
                    }}
                    onChange={() => setSel(allSelected ? new Set() : new Set(active.map((d) => d.id)))}
                    className="accent-[color:var(--mc-navy)] w-4 h-4 align-middle"
                  />
                </th>
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
                const checked = sel.has(d.id);
                return (
                  <tr
                    key={d.id}
                    className={`border-t border-[color:var(--mc-border)] ${checked ? "bg-[color:var(--mc-teal-soft)]/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${d.title}`}
                        checked={checked}
                        onChange={() => setSel((s) => toggle(s, d.id))}
                        className="accent-[color:var(--mc-navy)] w-4 h-4 align-middle"
                      />
                    </td>
                    <td className="px-4 py-3 text-[color:var(--mc-ink)]">{d.title}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-[color:var(--mc-steel)]">
                      {d.doc_number ?? "—"}
                    </td>
                    <td className="px-4 py-3">{STATE_LABELS[d.status] ?? d.status}</td>
                    <td className="px-4 py-3">
                      {d.review_due ? (
                        <span className={overdue ? "text-[#C0392B] font-semibold" : ""}>
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
                          className="text-[color:var(--mc-teal)] font-medium hover:underline mr-3"
                        >
                          Abrir
                        </Link>
                      )}
                      <button
                        onClick={() => run([d.id], "delete")}
                        disabled={busy}
                        className="text-[color:var(--mc-steel)] hover:text-[#C0392B] disabled:opacity-50"
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
            className="text-[13px] text-[color:var(--mc-steel)] hover:underline"
          >
            {showTrash ? "▾" : "▸"} Papelera ({trashed.length}) — se eliminan a los 30 días
          </button>
          {showTrash && (
            <div className="mt-2">
              {selTrash.size > 0 && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-[10px] border border-[color:var(--mc-border)] bg-[color:var(--mc-muted)] px-4 py-2">
                  <span className="text-[13px]">
                    <span className="font-semibold">{selTrash.size}</span> seleccionado
                    {selTrash.size === 1 ? "" : "s"}
                  </span>
                  <button
                    onClick={() => run([...selTrash], "recover")}
                    disabled={busy}
                    className="rounded-[8px] border border-[color:var(--mc-border)] text-[color:var(--mc-navy)] px-4 py-1.5 text-[13px] font-medium hover:border-[color:var(--mc-navy)] disabled:opacity-50"
                  >
                    {busy ? "Recuperando…" : "Recuperar seleccionados"}
                  </button>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-[color:var(--mc-border)] bg-white">
                <table className="w-full text-[13px]">
                  <tbody>
                    {trashed.map((d) => {
                      const left = d.deleted_at
                        ? Math.max(0, 30 - Math.floor((Date.now() - new Date(d.deleted_at).getTime()) / 86400000))
                        : 30;
                      return (
                        <tr key={d.id} className="border-t border-[color:var(--mc-border)] first:border-t-0">
                          <td className="w-10 px-4 py-3">
                            <input
                              type="checkbox"
                              aria-label={`Seleccionar ${d.title}`}
                              checked={selTrash.has(d.id)}
                              onChange={() => setSelTrash((s) => toggle(s, d.id))}
                              className="accent-[color:var(--mc-navy)] w-4 h-4 align-middle"
                            />
                          </td>
                          <td className="px-4 py-3 text-[color:var(--mc-steel)] line-through">{d.title}</td>
                          <td className="px-4 py-3 text-[12px] text-[color:var(--mc-steel)]">
                            se elimina en {left} día{left === 1 ? "" : "s"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => run([d.id], "recover")}
                              disabled={busy}
                              className="text-[color:var(--mc-teal)] font-medium hover:underline disabled:opacity-50"
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
