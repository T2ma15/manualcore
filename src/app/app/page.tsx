import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoUploader from "./LogoUploader";
import DocsTable from "./DocsTable";

const STATE_LABELS: Record<string, string> = {
  draft: "Borrador",
  under_review: "En revisión",
  approved: "Aprobado",
  released: "Publicado",
  obsolete: "Obsoleto",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("tenants(logo_url)")
    .eq("auth_user_id", user?.id ?? "")
    .single();
  const logo = (profile?.tenants as { logo_url?: string } | null)?.logo_url ?? null;

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, status, doc_number, session_id, review_due, deleted_at")
    .order("updated_at", { ascending: false });

  const all = documents ?? [];
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const active = all.filter((d) => !d.deleted_at);
  const trashed = all.filter((d) => d.deleted_at && d.deleted_at > thirtyAgo);

  const counts = active.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);
  const overdue = active.filter(
    (d) => d.review_due && d.review_due < today && (d.status === "approved" || d.status === "released"),
  ).length;

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

      <div className="mt-6">
        <LogoUploader initialLogo={logo} />
      </div>

      {overdue > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">{overdue}</span> documento{overdue === 1 ? "" : "s"} con
          fecha de revisión vencida. Revísalo{overdue === 1 ? "" : "s"} para mantener el control al día.
        </div>
      )}

      {/* Conteos por estado */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATE_LABELS).map(([key, label]) => (
          <div
            key={key}
            className="rounded-xl bg-white border border-[color:var(--mc-border)] px-4 py-4"
          >
            <p className="text-3xl font-bold text-[color:var(--mc-navy)]">{counts[key] ?? 0}</p>
            <p className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)] mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-4 text-sm font-semibold uppercase tracking-wide text-[color:var(--mc-steel)]">
        Tus documentos
      </h2>
      <DocsTable active={active} trashed={trashed} />
    </div>
  );
}
