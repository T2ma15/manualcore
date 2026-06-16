import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Borrar (papelera) o recuperar uno o VARIOS documentos. Deja trazabilidad en audit_log.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  // Acepta un id solo (documentId) o varios (documentIds) para la multiselección.
  const ids: string[] = Array.isArray(body.documentIds)
    ? body.documentIds.filter((x: unknown) => typeof x === "string" && x)
    : body.documentId
      ? [String(body.documentId)]
      : [];

  if (ids.length === 0 || (action !== "delete" && action !== "recover")) {
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

  const deletedAt = action === "delete" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: deletedAt })
    .in("id", ids)
    .eq("tenant_id", profile.tenant_id);
  if (error) return NextResponse.json({ error: "No se pudo procesar." }, { status: 500 });

  // Trazabilidad: una entrada por documento (queda registro de que existió y de la acción).
  await supabase.from("audit_log").insert(
    ids.map((id) => ({
      tenant_id: profile.tenant_id,
      actor_id: profile.id,
      actor_type: "user",
      event_type: action === "delete" ? "document_deleted" : "document_recovered",
      table_name: "documents",
      record_id: id,
    })),
  );

  return NextResponse.json({ ok: true, count: ids.length });
}
