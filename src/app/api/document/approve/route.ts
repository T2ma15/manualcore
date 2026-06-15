import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sessionId: string | undefined = body.sessionId;
  const docNumber: string = String(body.docNumber ?? "").trim();
  const ownerName: string = String(body.ownerName ?? "").trim();
  const approverName: string = String(body.approverName ?? "").trim();
  const reviewDue: string = String(body.reviewDue ?? "").trim();

  if (!sessionId) return NextResponse.json({ error: "Falta la sesión." }, { status: 400 });
  if (!docNumber) return NextResponse.json({ error: "Falta el código del documento." }, { status: 400 });
  if (!ownerName || !approverName)
    return NextResponse.json({ error: "Indica quién elaboró y quién aprobó." }, { status: 400 });
  if (!reviewDue)
    return NextResponse.json({ error: "Indica la fecha de próxima revisión." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  // Documento de la sesión (creado al iniciar)
  const { data: doc } = await supabase
    .from("documents")
    .select("id, status")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!doc) return NextResponse.json({ error: "No encuentro el documento." }, { status: 404 });

  // Control de cambios: no se aprueba si hay relacionados pendientes de revisar.
  try {
    const { data: pending } = await supabase
      .from("document_relations")
      .select("to_title")
      .or(`from_document_id.eq.${doc.id},to_document_id.eq.${doc.id}`)
      .eq("needs_review", true);
    if (pending && pending.length) {
      return NextResponse.json(
        {
          error: `Hay ${pending.length} documento(s) relacionado(s) pendientes de revisar por un cambio. Confírmalos en la matriz antes de aprobar.`,
        },
        { status: 409 },
      );
    }
  } catch {
    // tabla no creada todavía — se ignora
  }

  const { error } = await supabase
    .from("documents")
    .update({
      doc_number: docNumber,
      owner_name: ownerName,
      approver_name: approverName,
      review_due: reviewDue,
      status: "approved",
    })
    .eq("id", doc.id);

  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("unique") || msg.includes("duplicate") || error.code === "23505") {
      return NextResponse.json(
        { error: `El código "${docNumber}" ya existe. Usa otro número.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "No se pudo aprobar. Intenta de nuevo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, docNumber });
}
