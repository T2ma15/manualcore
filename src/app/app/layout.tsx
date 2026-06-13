import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, role, tenant_id, tenants(name)")
    .eq("auth_user_id", user.id)
    .single();

  const companyName =
    (profile?.tenants as { name?: string } | null)?.name ?? "Mi empresa";

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--mc-muted)] text-[color:var(--mc-ink)]">
      <header className="bg-[color:var(--mc-navy)] text-white">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-md bg-[color:var(--mc-teal)] flex items-center justify-center font-bold text-[color:var(--mc-navy)] text-sm">
              M
            </span>
            <span className="font-semibold tracking-tight">ManualCore</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/70 hidden sm:inline">{companyName}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/90">{profile?.full_name}</span>
            <form action={signOut}>
              <button className="rounded-full border border-white/20 px-3 py-1 text-white/80 hover:bg-white/10">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
