export default function Home() {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[color:var(--mc-navy)] text-white">
      {/* Top bar */}
      <header className="w-full border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-[color:var(--mc-teal)] flex items-center justify-center font-bold text-[color:var(--mc-navy)]">
              M
            </div>
            <span className="font-semibold tracking-tight text-lg">
              ManualCore
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-8 text-sm text-white/80">
            <a href="#by-function" className="hover:text-white">
              By function
            </a>
            <a href="#by-use-case" className="hover:text-white">
              By use case
            </a>
            <a
              href="/login"
              className="rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-4 py-2 font-medium hover:opacity-90"
            >
              Iniciar sesión
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[color:var(--mc-teal)] text-sm font-semibold tracking-widest uppercase mb-4">
              Process Knowledge Formalization Engine
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
              Every process.
              <br />
              <span className="text-[color:var(--mc-teal)]">
                Fully documented.
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-lg">
              Formaliza y controla la documentación de tus procesos. Le cuentas
              a un asistente cómo trabajas — en tus palabras — y él te entrega
              SOPs, flujogramas y análisis de riesgos formales, con control de
              revisiones y aprobaciones.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="/registro"
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-8 py-3 font-semibold hover:opacity-90"
              >
                Empezar gratis
              </a>
              <a
                href="#demo"
                className="inline-flex items-center justify-center rounded-full border border-white/25 px-8 py-3 font-semibold hover:bg-white/5"
              >
                Ver demo
              </a>
            </div>
          </div>

          {/* Visual block — brand color squares as placeholder */}
          <div className="hidden md:block">
            <div className="relative rounded-2xl bg-[color:var(--mc-steel)] p-8 shadow-2xl shadow-black/40 border border-white/10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[color:var(--mc-teal)]" />
                  <p className="text-xs uppercase tracking-widest text-white/60">
                    Session
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-sm text-white/90">
                  <span className="text-[color:var(--mc-teal)]">Brain:</span>{" "}
                  Detecté 5 operaciones, 3 materiales y 2 specs de 5M.
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-sm text-white/90">
                  <span className="text-amber-300">Question:</span> ¿Cuál es el
                  límite de CCP para torque en la operación 3?
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-sm text-white/90">
                  <span className="text-emerald-300">Confirmation:</span> SOP
                  generado. Número asignado:{" "}
                  <code className="text-white">PRD-MFG0001-REV00</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-white/60">
          <p>© {new Date().getFullYear()} ManualCore. República Dominicana.</p>
          <p className="font-mono text-xs">V0 · MVP</p>
        </div>
      </footer>
    </div>
  );
}
