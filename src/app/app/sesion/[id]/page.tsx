import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Chat from "./Chat";

export default async function SesionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, status, template_id, document_templates(name_es)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const templateName =
    (session.document_templates as { name_es?: string } | null)?.name_es ??
    "Documento";

  const { data: chatRows } = await supabase
    .from("chat_messages")
    .select("id, role, msg_type, content")
    .eq("session_id", id)
    .order("created_at", { ascending: true });
  const initialMessages = chatRows ?? [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href="/app" className="text-sm text-[color:var(--mc-steel)] hover:underline">
        ← Volver al panel
      </Link>

      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        {/* Panel chat */}
        <section className="rounded-2xl border border-[color:var(--mc-border)] bg-white p-6 flex flex-col">
          <h2 className="font-semibold text-[color:var(--mc-navy)]">
            {templateName}
          </h2>
          <p className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)] mt-1 mb-4">
            Asistente de documentación
          </p>
          <Chat
            sessionId={session.id}
            initialMessages={initialMessages}
            initialReady={session.status === "confirmed"}
          />
        </section>

        {/* Vista previa del documento */}
        <section className="rounded-2xl border border-[color:var(--mc-border)] bg-white p-6 min-h-[400px]">
          <p className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)]">
            Vista previa
          </p>
          <div className="mt-3 rounded-lg bg-[color:var(--mc-muted)] h-full min-h-[320px] flex items-center justify-center text-[color:var(--mc-steel)]">
            El documento aparecerá aquí mientras lo construyes.
          </div>
        </section>
      </div>
    </div>
  );
}
