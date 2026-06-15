"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Rel = {
  id: string;
  to_title: string;
  to_code: string | null;
  rel_type: string;
  relation: string | null;
  frequency: string | null;
  status: string;
  needs_review: boolean;
  review_reason: string | null;
  from_title: string;
  from_code: string | null;
  to_session_id: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  registro: "Registro",
  checklist: "Checklist",
  formato: "Formato",
  instructivo: "Instructivo",
  sop: "SOP",
  politica: "Política",
  analisis_riesgo: "Análisis de riesgo",
  plan_inspeccion: "Plan de inspección",
  otro: "Documento",
};

const STATUS_LABEL: Record<string, string> = {
  existing: "Ya existe",
  suggested: "Por crear",
  created: "Creado",
};

export default function MatrizClient({ rels }: { rels: Rel[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(url: string, body: object, id: string, onOk?: (d: unknown) => void) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((d as { error?: string }).error ?? "No se pudo");
      if (onOk) onOk(d);
      else router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo");
    } finally {
      setBusy(null);
    }
  }

  function confirmReview(id: string) {
    call("/api/relation/confirm", { relationId: id }, id);
  }
  function createDoc(id: string) {
    call("/api/relation/create", { relationId: id }, id, (d) => {
      const sid = (d as { sessionId?: string }).sessionId;
      if (sid) router.push(`/app/sesion/${sid}`);
      else router.refresh();
    });
  }
  function markExists(id: string) {
    const code = prompt("¿Cuál es el código de ese documento? (déjalo vacío si no tiene)");
    if (code === null) return;
    call("/api/relation/update", { relationId: id, action: "exists", code }, id);
  }
  function remove(id: string) {
    if (!confirm("¿Quitar este relacionado de la matriz?")) return;
    call("/api/relation/update", { relationId: id, action: "remove" }, id);
  }

  if (rels.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[color:var(--mc-border)] bg-white px-6 py-12 text-center text-[color:var(--mc-steel)]">
        Todavía no hay relaciones. Cuando describas un proceso donde algo se mide, inspecciona o
        registra, el asistente lo enlazará aquí automáticamente.
      </div>
    );
  }

  const pending = rels.filter((r) => r.needs_review).length;

  return (
    <div className="space-y-4">
      {pending > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">{pending}</span> relación{pending === 1 ? "" : "es"} marcada
          {pending === 1 ? "" : "s"} <strong>para revisar</strong> por un cambio. Confírmalas para poder
          aprobar los documentos afectados.
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[color:var(--mc-border)] bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--mc-muted)] text-[color:var(--mc-steel)] text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Documento origen</th>
              <th className="px-4 py-3 font-medium">Relacionado</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Qué se registra · frecuencia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rels.map((r) => (
              <tr
                key={r.id}
                className={`border-t border-[color:var(--mc-border)] ${r.needs_review ? "bg-amber-50/60" : ""}`}
              >
                <td className="px-4 py-3">
                  <div>{r.from_title}</div>
                  {r.from_code && (
                    <div className="font-mono text-xs text-[color:var(--mc-steel)]">{r.from_code}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{r.to_title}</div>
                  {r.to_code && (
                    <div className="font-mono text-xs text-[color:var(--mc-steel)]">{r.to_code}</div>
                  )}
                </td>
                <td className="px-4 py-3">{TYPE_LABEL[r.rel_type] ?? "Documento"}</td>
                <td className="px-4 py-3 text-[color:var(--mc-steel)]">
                  {r.relation || "—"}
                  {r.frequency ? <span className="block text-xs">cada {r.frequency}</span> : null}
                </td>
                <td className="px-4 py-3">
                  {r.needs_review ? (
                    <span className="inline-block rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
                      Revisar{r.review_reason ? ` · ${r.review_reason}` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-[color:var(--mc-steel)]">
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                  {r.needs_review && (
                    <button
                      onClick={() => confirmReview(r.id)}
                      disabled={busy === r.id}
                      className="text-[color:var(--mc-navy)] font-semibold hover:underline disabled:opacity-50"
                    >
                      Confirmar revisión
                    </button>
                  )}
                  {!r.needs_review && r.status === "suggested" && (
                    <>
                      <button
                        onClick={() => createDoc(r.id)}
                        disabled={busy === r.id}
                        className="text-[color:var(--mc-teal)] font-semibold hover:underline disabled:opacity-50"
                      >
                        Crear
                      </button>
                      <button
                        onClick={() => markExists(r.id)}
                        disabled={busy === r.id}
                        className="text-[color:var(--mc-steel)] hover:underline disabled:opacity-50"
                      >
                        Ya existe
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        disabled={busy === r.id}
                        className="text-[color:var(--mc-steel)] hover:text-red-600 disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </>
                  )}
                  {!r.needs_review && r.status === "created" && r.to_session_id && (
                    <Link
                      href={`/app/sesion/${r.to_session_id}`}
                      className="text-[color:var(--mc-teal)] font-semibold hover:underline"
                    >
                      Abrir
                    </Link>
                  )}
                  {!r.needs_review && r.status === "existing" && (
                    <button
                      onClick={() => remove(r.id)}
                      disabled={busy === r.id}
                      className="text-[color:var(--mc-steel)] hover:text-red-600 disabled:opacity-50"
                    >
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
