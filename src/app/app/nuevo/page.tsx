import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  INDUSTRIES,
  TEMPLATES_BY_INDUSTRY,
  type IndustryCode,
} from "@/lib/constants";
import { createDraft } from "./actions";

export default async function NuevoPage({
  searchParams,
}: {
  searchParams: Promise<{ industria?: string }>;
}) {
  const { industria } = await searchParams;
  const industry = INDUSTRIES.find((i) => i.code === industria);

  // PASO 1 — elegir industria
  if (!industry) {
    return (
      <Shell step={1} title="¿Qué tipo de proceso vas a documentar?">
        <div className="grid sm:grid-cols-2 gap-4">
          {INDUSTRIES.map((ind) => (
            <Link
              key={ind.code}
              href={`/app/nuevo?industria=${ind.code}`}
              className="group rounded-2xl border border-[color:var(--mc-border)] bg-white p-6 hover:border-[color:var(--mc-teal)] hover:shadow-lg transition"
            >
              <div className="text-4xl">{ind.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-[color:var(--mc-navy)]">
                {ind.label}
              </h3>
              <p className="mt-1 text-sm text-[color:var(--mc-steel)]">
                {ind.description}
              </p>
            </Link>
          ))}
        </div>
      </Shell>
    );
  }

  // PASO 2 — elegir template (filtrado por industria, leído de la BD)
  const allowed = TEMPLATES_BY_INDUSTRY[industry.code as IndustryCode];
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("document_templates")
    .select("id, code, name_es, output_format")
    .in("code", allowed)
    .eq("is_active", true);

  // ordenar según el orden definido en la constante
  const ordered = (templates ?? []).sort(
    (a, b) => allowed.indexOf(a.code) - allowed.indexOf(b.code),
  );

  return (
    <Shell
      step={2}
      title={`${industry.label}: ¿qué documento quieres crear?`}
      back
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ordered.map((t) => (
          <form key={t.id} action={createDraft}>
            <input type="hidden" name="template_id" value={t.id} />
            <input type="hidden" name="template_name" value={t.name_es} />
            <input type="hidden" name="industry" value={industry.code} />
            <button
              type="submit"
              className="w-full text-left rounded-2xl border border-[color:var(--mc-border)] bg-white p-5 hover:border-[color:var(--mc-teal)] hover:shadow-lg transition"
            >
              <span className="text-xs font-mono uppercase tracking-wide text-[color:var(--mc-teal)]">
                {t.output_format}
              </span>
              <h3 className="mt-2 font-semibold text-[color:var(--mc-navy)]">
                {t.name_es}
              </h3>
            </button>
          </form>
        ))}
      </div>
    </Shell>
  );
}

function Shell({
  step,
  title,
  children,
  back,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  back?: boolean;
}) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-[color:var(--mc-steel)]">
        <span className={step >= 1 ? "text-[color:var(--mc-teal)] font-semibold" : ""}>
          1. Industria
        </span>
        <span>→</span>
        <span className={step >= 2 ? "text-[color:var(--mc-teal)] font-semibold" : ""}>
          2. Documento
        </span>
        <span>→</span>
        <span>3. Documentar</span>
      </div>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[color:var(--mc-navy)]">
        {title}
      </h1>

      <div className="mt-8">{children}</div>

      {back && (
        <Link
          href="/app/nuevo"
          className="inline-block mt-8 text-sm text-[color:var(--mc-steel)] hover:underline"
        >
          ← Cambiar industria
        </Link>
      )}
    </div>
  );
}
