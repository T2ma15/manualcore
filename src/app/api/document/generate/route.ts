import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDocx } from "@/lib/docgen/docx";
import { generateXlsx } from "@/lib/docgen/xlsx";
import { generateHtml } from "@/lib/docgen/html";
import { generateDocumentContent } from "@/lib/brain/document";
import { TEMPLATE_NAMES } from "@/lib/templates-guide";
import type { DocData } from "@/lib/docgen/types";

const MIME: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  html_svg: "text/html; charset=utf-8",
};
const EXT: Record<string, string> = { docx: "docx", xlsx: "xlsx", html_svg: "html" };

function slug(s: string) {
  return (s || "documento")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 50);
}

export async function POST(req: Request) {
  const { sessionId } = await req.json().catch(() => ({}));
  if (!sessionId) return NextResponse.json({ error: "Falta sessionId." }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id, tenants(name, logo_url)")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Sin perfil." }, { status: 403 });

  const { data: session } = await supabase
    .from("sessions")
    .select("id, process_name, language, document_templates(code, output_format)")
    .eq("id", sessionId)
    .single();
  if (!session) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });

  const tpl = session.document_templates as { code?: string; output_format?: string } | null;
  const code = tpl?.code ?? "sop_mfg";
  const format = tpl?.output_format ?? "docx";
  const language = (session.language as "es" | "en") ?? "es";

  // Estado del documento (numeración/aprobación)
  const { data: doc } = await supabase
    .from("documents")
    .select("doc_number, status, owner_name, approver_name, review_due, effective_date, revision_number")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: rows } = await supabase
    .from("brain_extractions")
    .select("field_path, extracted_value, category")
    .eq("session_id", sessionId);

  if (!rows || rows.length === 0) {
    return NextResponse.json(
      { error: "Aún no hay contenido. Conversa con el asistente primero." },
      { status: 400 },
    );
  }

  // El cerebro REDACTA el documento (secciones, pasos, tablas) desde la conversación.
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(80);
  const conversation = (history ?? []).map((m) => ({
    role: m.role === "engineer" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));
  const content = await generateDocumentContent(
    conversation,
    code,
    TEMPLATE_NAMES[code]?.es ?? "Documento",
    language,
  );

  const tenant = profile.tenants as { name?: string; logo_url?: string } | null;
  const revNum = (doc?.revision_number ?? 0) as number;
  const data: DocData = {
    tenantName: tenant?.name ?? "Mi empresa",
    logoDataUrl: tenant?.logo_url ?? null,
    templateCode: code,
    templateName: TEMPLATE_NAMES[code]?.es ?? "Documento",
    processName: session.process_name ?? "Proceso sin nombre",
    docNumber: (doc?.doc_number as string | null) ?? null, // null hasta aprobar → BORRADOR
    revision: `REV${String(revNum).padStart(2, "0")}`,
    status: (doc?.status as string) ?? "draft",
    effectiveDate: (doc?.effective_date as string | null) ?? null,
    reviewDue: (doc?.review_due as string | null) ?? null,
    owner: (doc?.owner_name as string | null) ?? null,
    approver: (doc?.approver_name as string | null) ?? null,
    extracted: rows.map((r) => ({
      field: r.field_path ?? "",
      value: r.extracted_value ?? "",
      category: r.category ?? "otro",
    })),
    sections: content?.sections ?? null,
  };

  let body: Buffer | string;
  try {
    if (format === "xlsx") body = await generateXlsx(data);
    else if (format === "html_svg") body = generateHtml(data);
    else body = await generateDocx(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error generando";
    return NextResponse.json({ error: `No se pudo generar: ${msg}` }, { status: 500 });
  }

  const filename = `${slug(data.templateName)}-${slug(data.processName)}.${EXT[format] ?? "docx"}`;
  const payload = typeof body === "string" ? Buffer.from(body, "utf-8") : body;

  return new Response(new Uint8Array(payload), {
    status: 200,
    headers: {
      "Content-Type": MIME[format] ?? MIME.docx,
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
