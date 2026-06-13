import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href="/app" className="text-sm text-[color:var(--mc-steel)] hover:underline">
        ← Volver al panel
      </Link>

      <div className="mt-4 grid lg:grid-cols-2 gap-6">
        {/* Panel chat (Día 3) */}
        <section className="rounded-2xl border border-[color:var(--mc-border)] bg-white p-6 min-h-[400px] flex flex-col">
          <h2 className="font-semibold text-[color:var(--mc-navy)]">
            {templateName}
          </h2>
          <p className="text-xs uppercase tracking-wide text-[color:var(--mc-steel)] mt-1">
            Sesión iniciada
          </p>

          <div className="flex-1 flex items-center justify-center text-center">
            <div className="text-[color:var(--mc-steel)]">
              <div className="text-4xl">💬</div>
              <p className="mt-3 max-w-xs">
                Aquí va el asistente que te hará preguntas y construirá tu
                documento. (Se activa en el Día 3.)
              </p>
            </div>
          </div>
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
