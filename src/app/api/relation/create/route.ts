import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_NAMES } from "@/lib/templates-guide";

// Mapea el tipo de relacionado al template más cercano del catálogo.
const TYPE_TO_TEMPLATE: Record<string, string> = {
  registro: "inspection_plan", // un registro de control es una tabla de qué se anota
  checklist: "inspection_plan",
  formato: "inspection_plan",
  plan_inspeccion: "inspection_plan",
  analisis_riesgo: "risk_analysis",
  sop: "sop_mfg",
  instructivo: "sop_admin",
  politica: "quality_policy",
  otro: "sop_admin",
};

// "Crear este registro": genera una sesión + documento en borrador para el
// relacionado sugerido y lo enlaza (status -> created).
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

  const { data: rel } = await supabase
    .from("document_relations")
    .select("id, to_title, rel_type, status, to_document_id")
    .eq("id", relationId)
    .eq("tenant_id", profile.tenant_id)
    .single();
  if (!rel) return NextResponse.json({ error: "Relación no encontrada." }, { status: 404 });
  if (rel.to_document_id) {
    return NextResponse.json({ error: "Este relacionado ya fue creado." }, { status: 409 });
  }

  const code = TYPE_TO_TEMPLATE[(rel.rel_type as string) ?? "otro"] ?? "sop_admin";
  const { data: tpl } = await supabase
    .from("document_templates")
    .select("id")
    .eq("code", code)
    .single();
  if (!tpl) return NextResponse.json({ error: "No hay plantilla para este tipo." }, { status: 500 });

  const title = (rel.to_title as string) || "Registro";
  const templateName = TEMPLATE_NAMES[code]?.es ?? "Documento";

  // 1) sesión
  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({
      tenant_id: profile.tenant_id,
      created_by: profile.id,
      template_id: tpl.id,
      process_name: title,
      language: "es",
      status: "input",
    })
    .select("id")
    .single();
  if (sErr || !session) return NextResponse.json({ error: "No se pudo crear la sesión." }, { status: 500 });

  // 2) documento en borrador
  const { data: newDoc } = await supabase
    .from("documents")
    .insert({
      tenant_id: profile.tenant_id,
      session_id: session.id,
      template_id: tpl.id,
      doc_type: templateName,
      title: title,
      language: "es",
      status: "draft",
    })
    .select("id")
    .single();

  // 3) enlazar la relación al documento recién creado
  await supabase
    .from("document_relations")
    .update({ to_document_id: newDoc?.id ?? null, status: "created" })
    .eq("id", relationId)
    .eq("tenant_id", profile.tenant_id);

  return NextResponse.json({ ok: true, sessionId: session.id });
}
