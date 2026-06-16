import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUS = ["draft", "under_review", "approved", "released", "obsolete"];

// Edición en lote: cambia la fecha de próxima revisión (review_due) y/o el
// estado de varios documentos. El estado se aplica documento por documento
// porque la BD valida las transiciones (y exige review_due para revisar/aprobar);
// así un documento que no pueda cambiar no tumba a los demás.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.documentIds)
    ? body.documentIds.filter((x: unknown) => typeof x === "string" && x)
    : [];
  const reviewDue: string | null =
    typeof body.review_due === "string" && body.review_due ? body.review_due : null;
  const status: string | null =
    typeof body.status === "string" && VALID_STATUS.includes(body.status) ? body.status : null;

  if (ids.length === 0 || (!reviewDue && !status)) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
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

  // Caso simple y seguro: solo fecha → una sola consulta en lote.
  if (reviewDue && !status) {
    const { error } = await supabase
      .from("documents")
      .update({ review_due: reviewDue })
      .in("id", ids)
      .eq("tenant_id", profile.tenant_id);
    if (error) return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
    return NextResponse.json({ ok: true, updated: ids.length, failed: [] });
  }

  // Cambio de estado (con o sin fecha) → documento por documento, tolerante.
  const patch: Record<string, unknown> = { status };
  if (reviewDue) patch.review_due = reviewDue;

  const failed: { id: string; reason: string }[] = [];
  let updated = 0;
  for (const id of ids) {
    const { error } = await supabase
      .from("documents")
      .update(patch)
      .eq("id", id)
      .eq("tenant_id", profile.tenant_id);
    if (error) {
      const msg = (error.message || "").toLowerCase();
      let reason = "No se pudo cambiar.";
      if (msg.includes("transicion") || msg.includes("transición") || msg.includes("invalid"))
        reason = "Transición de estado no permitida desde su estado actual.";
      else if (msg.includes("review_due")) reason = "Necesita fecha de próxima revisión.";
      failed.push({ id, reason });
    } else {
      updated++;
    }
  }

  return NextResponse.json({ ok: true, updated, failed });
}
