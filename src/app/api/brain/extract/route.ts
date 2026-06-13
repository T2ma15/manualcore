import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, BRAIN_MODEL, estimateCostUsd } from "@/lib/brain/client";
import { buildSystemPrompt } from "@/lib/brain/prompts";
import { EXTRACTION_SCHEMA, type Extraction } from "@/lib/brain/schema";

export async function POST(req: Request) {
  const { sessionId, text } = await req.json().catch(() => ({}));
  if (!sessionId || !text || typeof text !== "string") {
    return NextResponse.json({ error: "Falta sessionId o texto." }, { status: 400 });
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

  // Sesión + template (RLS garantiza que sea del tenant del usuario)
  const { data: session } = await supabase
    .from("sessions")
    .select("id, tenant_id, language, document_templates(code, name_es, name_en)")
    .eq("id", sessionId)
    .single();
  if (!session) return NextResponse.json({ error: "Sesión no encontrada." }, { status: 404 });

  const template = session.document_templates as unknown as {
    code: string;
    name_es: string;
    name_en: string;
  };
  const language = (session.language as "es" | "en") ?? "es";

  // 1) Guardar el input del usuario + su mensaje en el chat
  await supabase.from("session_inputs").insert({
    tenant_id: profile.tenant_id,
    session_id: sessionId,
    kind: "text",
    content: text,
    language,
  });
  await supabase.from("chat_messages").insert({
    tenant_id: profile.tenant_id,
    session_id: sessionId,
    role: "engineer",
    msg_type: "free_text",
    content: text,
  });

  // 2) Llamar al brain (Claude Opus 4.8) con salida estructurada
  let extraction: Extraction;
  try {
    const client = anthropic();
    const resp = await client.messages.create({
      model: BRAIN_MODEL,
      max_tokens: 8000,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(template, language),
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: { type: "json_schema", schema: EXTRACTION_SCHEMA },
      },
      messages: [{ role: "user", content: text }],
    });

    const block = resp.content.find((b) => b.type === "text");
    extraction = JSON.parse(block && "text" in block ? block.text : "{}");

    // Registrar costo de la llamada (variable de negocio)
    await supabase.from("llm_calls").insert({
      tenant_id: profile.tenant_id,
      session_id: sessionId,
      purpose: "extract",
      model: BRAIN_MODEL,
      input_tokens: resp.usage.input_tokens,
      output_tokens: resp.usage.output_tokens,
      cost_usd: estimateCostUsd(
        BRAIN_MODEL,
        resp.usage.input_tokens,
        resp.usage.output_tokens,
      ),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error del brain";
    return NextResponse.json({ error: `El asistente falló: ${msg}` }, { status: 502 });
  }

  // 3) Persistir extracciones + construir mensajes de chat del brain
  if (extraction.extracted?.length) {
    await supabase.from("brain_extractions").insert(
      extraction.extracted.map((x) => ({
        tenant_id: profile.tenant_id,
        session_id: sessionId,
        field_path: x.field,
        extracted_value: x.value,
        status: "auto_written",
      })),
    );
  }

  const messages: { role: string; msg_type: string; content: string; options?: unknown }[] = [];

  // Confirmación: resumen + lo extraído
  const confirmationLines = [extraction.summary];
  if (extraction.extracted?.length) {
    confirmationLines.push(
      "",
      ...extraction.extracted.map((x) => `• ${x.field}: ${x.value}`),
    );
  }
  messages.push({ role: "brain", msg_type: "confirmation", content: confirmationLines.join("\n") });

  // Documentos relacionados (sugerencia, no asunción)
  if (extraction.related_docs?.length) {
    for (const d of extraction.related_docs) {
      messages.push({
        role: "brain",
        msg_type: "question",
        content: `Mencionas algo relacionado con "${d.name}" (${d.reason}). ¿Ese documento ya existe?`,
        options: ["Sí, ya existe", "No, agéndalo"],
      });
    }
  }

  // Preguntas por campos faltantes — críticas primero
  const ordered = [...(extraction.questions ?? [])].sort(
    (a, b) => Number(b.is_critical) - Number(a.is_critical),
  );
  for (const q of ordered) {
    messages.push({
      role: "brain",
      msg_type: "question",
      content: q.is_critical ? `⚠️ ${q.question}\n${q.why}` : `${q.question}\n${q.why}`,
    });
  }

  // Guardar mensajes del brain
  await supabase.from("chat_messages").insert(
    messages.map((m) => ({
      tenant_id: profile.tenant_id,
      session_id: sessionId,
      role: m.role,
      msg_type: m.msg_type,
      content: m.content,
      options: m.options ?? null,
    })),
  );

  // Actualizar estado de la sesión
  await supabase
    .from("sessions")
    .update({ status: "review", process_name: extraction.process_name })
    .eq("id", sessionId);

  return NextResponse.json({ ok: true, extraction, messages });
}
