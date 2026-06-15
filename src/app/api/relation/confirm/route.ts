import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Control de cambios: un responsable confirma que revisó el documento relacionado.
// Limpia la marca needs_review y deja constancia de quién/cuándo.
export async function POST(req: Request) {
  const { relationId } = await req.json().catch(() => ({}));
  if (!relationId) return NextResponse.json({ error: "Falta la relación." }, { status: 400 });

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

  const { error } = await supabase
    .from("document_relations")
    .update({
      needs_review: false,
      review_confirmed_by: profile.id,
      review_confirmed_at: new Date().toISOString(),
    })
    .eq("id", relationId)
    .eq("tenant_id", profile.tenant_id);

  if (error) return NextResponse.json({ error: "No se pudo confirmar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
