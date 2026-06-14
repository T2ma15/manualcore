import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TEMPLATE_GUIDE, TEMPLATE_NAMES } from "@/lib/templates-guide";
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
    .select("id, status, template_id, document_templates(code, name_es)")
    .eq("id", id)
    .single();

  if (!session) notFound();

  const tpl = session.document_templates as { code?: string; name_es?: string } | null;
  const templateName =
    (tpl?.code ? TEMPLATE_NAMES[tpl.code]?.es : undefined) ?? tpl?.name_es ?? "Documento";
  const guide = tpl?.code ? TEMPLATE_GUIDE[tpl.code] : undefined;

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
          <h2 className="font-semibold text-[color:var(--mc-navy)]">{templateName}</h2>
          <p className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)] mt-1 mb-4">
            Asistente de documentación
          </p>
          <Chat
            sessionId={session.id}
            initialMessages={initialMessages}
            initialReady={session.status === "confirmed"}
            example={guide?.ejemplo}
          />
        </section>

        {/* Panel de GUÍA — explica el documento al usuario novato */}
        <section className="rounded-2xl border border-[color:var(--mc-border)] bg-white p-6">
          {guide ? (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-[color:var(--mc-navy)]">
                  ¿Qué es {templateName}?
                </h3>
                <p className="mt-1 text-sm text-[color:var(--mc-steel)]">{guide.que_es}</p>
              </div>

              <GuideBlock title="Para qué sirve">{guide.objetivo}</GuideBlock>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mc-steel)]">
                  Qué necesito de ti
                </p>
                <ul className="mt-2 space-y-1">
                  {guide.datos_clave.map((d) => (
                    <li key={d} className="text-sm text-[color:var(--mc-ink)] flex gap-2">
                      <span className="text-[color:var(--mc-teal)]">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <GuideBlock title="Qué obtendrás al final">{guide.resultado}</GuideBlock>

              {guide.diferencia && (
                <div className="rounded-lg bg-[color:var(--mc-muted)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mc-steel)]">
                    Para que no te confundas
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--mc-ink)]">{guide.diferencia}</p>
                </div>
              )}

              <p className="text-xs text-[color:var(--mc-steel)] border-t border-[color:var(--mc-border)] pt-3">
                Tranquila: no tienes que saber documentar. Cuéntame lo que sabes del
                proceso y yo te pregunto lo que falte. Nada se aprueba sin tu revisión.
              </p>
            </div>
          ) : (
            <div className="text-sm text-[color:var(--mc-steel)]">
              El documento aparecerá aquí mientras lo construyes.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function GuideBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mc-steel)]">
        {title}
      </p>
      <p className="mt-1 text-sm text-[color:var(--mc-ink)]">{children}</p>
    </div>
  );
}
