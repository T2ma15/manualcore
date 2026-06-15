import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Editar una relación de la matriz: marcarla como "ya existe" (con su código),
// o eliminarla si el cerebro la detectó por error.
export async function POST(req: Request) {
  const { relationId, action, code } = await req.json().catch(() => ({}));
  if (!relationId || (action !== "exists" && action !== "remove")) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Sin perfil." }, { status: 403 });

  if (action === "remove") {
    const { error } = await supabase
      .from("document_relations")
      .delete()
      .eq("id", relationId)
      .eq("tenant_id", profile.tenant_id);
    if (error) return NextResponse.json({ error: "No se pudo eliminar." }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // action === "exists"
  const { error } = await supabase
    .from("document_relations")
    .update({ status: "existing", to_code: String(code ?? "").trim() || null })
    .eq("id", relationId)
    .eq("tenant_id", profile.tenant_id);
  if (error) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
