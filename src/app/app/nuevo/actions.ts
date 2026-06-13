"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Crea una sesión + documento en borrador y lleva a la vista de sesión (chat — Día 3).
export async function createDraft(formData: FormData) {
  const templateId = String(formData.get("template_id") ?? "");
  const templateName = String(formData.get("template_name") ?? "Documento");
  const industry = String(formData.get("industry") ?? "");

  if (!templateId) redirect("/app/nuevo");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, tenant_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // 1) sesión
  const { data: session, error: sErr } = await supabase
    .from("sessions")
    .insert({
      tenant_id: profile.tenant_id,
      created_by: profile.id,
      template_id: templateId,
      industry_profile: industry || null,
      language: "es",
      status: "input",
    })
    .select("id")
    .single();

  if (sErr || !session) {
    redirect("/app/nuevo?error=1");
  }

  // 2) documento en borrador
  const { data: doc } = await supabase
    .from("documents")
    .insert({
      tenant_id: profile.tenant_id,
      session_id: session.id,
      template_id: templateId,
      doc_type: templateName,
      title: `Nuevo: ${templateName}`,
      language: "es",
      status: "draft",
    })
    .select("id")
    .single();

  // 3) a la vista de sesión (el chat se construye en el Día 3)
  redirect(`/app/sesion/${session.id}${doc ? `?doc=${doc.id}` : ""}`);
}
