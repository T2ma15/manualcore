import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Nueva revisión: sube revision_number. El trigger de la BD marca los
// documentos relacionados como "revisar por cambio" (control de cambios).
export async function POST(req: Request) {
  const { documentId } = await req.json().catch(() => ({}));
  if (!documentId) return NextResponse.json({ error: "Falta el documento." }, { status: 400 });

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

  const { data: doc } = await supabase
    .from("documents")
    .select("id, revision_number")
    .eq("id", documentId)
    .eq("tenant_id", profile.tenant_id)
    .single();
  if (!doc) return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });

  const next = ((doc.revision_number as number) ?? 0) + 1;
  const { error } = await supabase
    .from("documents")
    .update({ revision_number: next })
    .eq("id", documentId)
    .eq("tenant_id", profile.tenant_id);
  if (error) return NextResponse.json({ error: "No se pudo crear la revisión." }, { status: 500 });

  return NextResponse.json({ ok: true, revision: next });
}
