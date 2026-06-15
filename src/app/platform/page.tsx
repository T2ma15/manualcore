import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PlatformPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("auth_user_id", user.id)
    .single();

  const isPlatform = profile?.role === "platform_owner";

  if (!isPlatform) {
    return (
      <div className="min-h-screen bg-[color:var(--mc-navy)] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Panel de plataforma</h1>
          <p className="mt-3 text-white/70">
            Esta sección es solo para el equipo de ManualCore. Tu usuario no tiene el rol
            <code className="mx-1 text-[color:var(--mc-teal)]">platform_owner</code>.
          </p>
          <p className="mt-3 text-sm text-white/50">
            Para activarla en tu cuenta, en Supabase corre:
            <br />
            <code className="text-xs">
              update users set role=&apos;platform_owner&apos; where email=&apos;tu@correo&apos;;
            </code>
          </p>
          <Link href="/app" className="inline-block mt-6 text-[color:var(--mc-teal)] hover:underline">
            ← Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  // platform_owner ve todo (RLS lo permite)
  const [tenantsRes, docsRes, usersRes, llmRes] = await Promise.all([
    supabase.from("tenants").select("id, name, created_at, is_active").order("created_at", { ascending: false }),
    supabase.from("documents").select("tenant_id, status, deleted_at"),
    supabase.from("users").select("id"),
    supabase.from("llm_calls").select("cost_usd"),
  ]);

  const tenants = tenantsRes.data ?? [];
  const docs = (docsRes.data ?? []).filter((d) => !d.deleted_at);
  const usersCount = (usersRes.data ?? []).length;
  const apiCost = (llmRes.data ?? []).reduce((s, r) => s + (Number(r.cost_usd) || 0), 0);

  const docsByTenant = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.tenant_id] = (acc[d.tenant_id] ?? 0) + 1;
    return acc;
  }, {});

  const metrics = [
    { label: "Empresas", value: tenants.length },
    { label: "Documentos", value: docs.length },
    { label: "Usuarios", value: usersCount },
    { label: "Costo API (USD)", value: `$${apiCost.toFixed(2)}` },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--mc-canvas)]">
      <header className="bg-[color:var(--mc-navy)] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold tracking-tight">ManualCore · Plataforma</span>
          <Link href="/app" className="text-sm text-white/75 hover:text-white">
            Mi panel →
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-[color:var(--mc-navy)]">Vista de plataforma</h1>
        <p className="text-[color:var(--mc-steel)] mt-1">Todas las empresas, en una pantalla.</p>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-white border border-[color:var(--mc-border)] px-4 py-4">
              <p className="text-3xl font-bold text-[color:var(--mc-navy)]">{m.value}</p>
              <p className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)] mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-[color:var(--mc-steel)]">
          Empresas
        </h2>
        <div className="overflow-hidden rounded-xl border border-[color:var(--mc-border)] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--mc-muted)] text-[color:var(--mc-steel)] text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Documentos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Alta</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-[color:var(--mc-border)]">
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3">{docsByTenant[t.id] ?? 0}</td>
                  <td className="px-4 py-3">{t.is_active ? "Activa" : "Inactiva"}</td>
                  <td className="px-4 py-3 text-[color:var(--mc-steel)]">
                    {String(t.created_at).slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
