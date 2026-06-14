import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-10 bg-[color:var(--mc-navy)]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[color:var(--mc-teal)] flex items-center justify-center font-extrabold text-[color:var(--mc-navy)]">
              M
            </div>
            <span className="font-bold tracking-tight text-lg text-white">ManualCore</span>
          </div>
          <nav className="hidden sm:flex items-center gap-8 text-sm text-white/75">
            <a href="#como" className="hover:text-white transition">Cómo funciona</a>
            <a href="#documentos" className="hover:text-white transition">Qué creas</a>
            <Link href="/login" className="hover:text-white transition">Iniciar sesión</Link>
            <Link
              href="/registro"
              className="rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-4 py-2 font-semibold hover:opacity-90 transition"
            >
              Empezar gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* ---------- Hero (navy) ---------- */}
      <section className="bg-[color:var(--mc-navy)] text-white">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          <div>
            <p className="text-[color:var(--mc-teal)] text-xs font-bold tracking-[0.18em] uppercase mb-5">
              Documentación de procesos con IA
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.05] tracking-tight">
              Cada proceso,
              <br />
              <span className="text-[color:var(--mc-teal)]">documentado de verdad.</span>
            </h1>
            <p className="mt-6 text-lg text-white/75 leading-relaxed max-w-xl">
              Cuéntale a un asistente cómo trabajas — por voz, foto o texto — y él
              te entrega SOPs, flujogramas y análisis de riesgo formales. Te
              pregunta lo que falta, incluso lo que no sabías que faltaba.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Link
                href="/registro"
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-7 py-3.5 font-semibold hover:opacity-90 transition"
              >
                Empezar gratis
              </Link>
              <a
                href="#como"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white hover:bg-white/5 transition"
              >
                Ver cómo funciona
              </a>
            </div>
            <p className="mt-5 text-sm text-white/45">
              Sin tarjeta · Para PyMEs y consultores · Español e inglés
            </p>
          </div>

          {/* Preview de sesión — más limpio y moderno */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2 w-2 rounded-full bg-[color:var(--mc-teal)]" />
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/50 font-semibold">
                  Sesión en vivo
                </span>
              </div>
              <div className="space-y-2.5">
                <Bubble tone="engineer">
                  Ensamblamos la tapa con una riveteadora, fuerza 450 N. Lo hace Juan en la línea 3.
                </Bubble>
                <Bubble tone="confirm" label="Asistente">
                  Detecté 5 operaciones, 2 materiales y el parámetro crítico 450 N ± 20.
                </Bubble>
                <Bubble tone="question" label="Pregunta">
                  ¿Qué EPP usa el operador? Y, ¿qué pasa si la fuerza sale del rango?
                </Bubble>
                <Bubble tone="system" label="Listo">
                  SOP generado · PRD-MFG0001 · REV00
                </Bubble>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Cómo funciona (claro) ---------- */}
      <section id="como" className="bg-[color:var(--mc-paper)]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-[color:var(--mc-teal)] text-xs font-bold tracking-[0.18em] uppercase mb-3">
            Cómo funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--mc-navy)] max-w-2xl">
            De lo que sabes en la cabeza, a un documento formal — en una tarde.
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <Step n="1" title="Cuéntalo como sea">
              Describe el proceso por voz, sube una foto de la pizarra, o escríbelo.
              En tus palabras — no necesitas saber documentar.
            </Step>
            <Step n="2" title="El asistente te guía">
              Extrae lo que entiende y te pregunta lo que falta, incluyendo las
              criticidades de seguridad y calidad que nadie pensó en mencionar.
            </Step>
            <Step n="3" title="Recibe tu documento">
              Un SOP, flujograma o análisis de riesgo formal — con tu membrete,
              numeración, control de revisiones y aprobaciones.
            </Step>
          </div>
        </div>
      </section>

      {/* ---------- Qué creas (canvas) ---------- */}
      <section id="documentos" className="bg-[color:var(--mc-canvas)] border-y border-[color:var(--mc-border)]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-[color:var(--mc-teal)] text-xs font-bold tracking-[0.18em] uppercase mb-3">
            Qué puedes crear
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--mc-navy)]">
            Tu documentación, sin un departamento de calidad.
          </h2>

          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["SOP de Manufactura", "Instructivo de un proceso de producción, paso a paso."],
              ["SOP Administrativo", "Procesos de oficina y servicio, con sus controles."],
              ["Análisis de Riesgos", "Qué puede salir mal y cómo se controla."],
              ["Flujograma", "El flujo del proceso, visual y claro."],
              ["Política de Calidad", "La promesa oficial de tu empresa."],
              ["Objetivos de Calidad", "Metas medibles con plazos y responsables."],
              ["Alcance del SGC", "Qué cubre tu sistema de calidad."],
              ["Lista Maestra", "El índice de todos tus documentos, al día."],
            ].map(([t, d]) => (
              <div
                key={t}
                className="rounded-xl bg-white border border-[color:var(--mc-border)] p-5"
              >
                <h3 className="font-bold text-[color:var(--mc-navy)]">{t}</h3>
                <p className="mt-1.5 text-sm text-[color:var(--mc-steel)] leading-snug">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Cierre ---------- */}
      <section className="bg-[color:var(--mc-navy)] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            El conocimiento de tu gente, formalizado antes de que se vaya con ellos.
          </h2>
          <Link
            href="/registro"
            className="inline-flex items-center justify-center rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-8 py-3.5 font-semibold hover:opacity-90 transition mt-8"
          >
            Empezar gratis
          </Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[color:var(--mc-navy)] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-white/55">
          <p>© {new Date().getFullYear()} ManualCore · República Dominicana</p>
          <p className="font-mono text-xs">V0 · MVP</p>
        </div>
      </footer>
    </div>
  );
}

function Bubble({
  tone,
  label,
  children,
}: {
  tone: "engineer" | "confirm" | "question" | "system";
  label?: string;
  children: React.ReactNode;
}) {
  const styles: Record<string, string> = {
    engineer: "bg-white/10 text-white/90",
    confirm: "bg-white/[0.04] text-white/85 border border-emerald-400/20",
    question: "bg-white/[0.04] text-white/85 border border-amber-400/20",
    system: "bg-[color:var(--mc-teal)]/10 text-white/85 border border-[color:var(--mc-teal)]/30",
  };
  const labelColor: Record<string, string> = {
    confirm: "text-emerald-300",
    question: "text-amber-300",
    system: "text-[color:var(--mc-teal)]",
    engineer: "",
  };
  return (
    <div className={`rounded-xl px-4 py-2.5 text-sm leading-snug ${styles[tone]}`}>
      {label && <span className={`font-semibold ${labelColor[tone]}`}>{label}: </span>}
      {children}
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="h-10 w-10 rounded-full bg-[color:var(--mc-teal)]/12 text-[color:var(--mc-teal)] flex items-center justify-center font-extrabold">
        {n}
      </div>
      <h3 className="mt-4 text-lg font-bold text-[color:var(--mc-navy)]">{title}</h3>
      <p className="mt-2 text-[color:var(--mc-steel)] leading-relaxed">{children}</p>
    </div>
  );
}
