"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/auth/actions";

const initial: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initial);

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--mc-navy)] text-white">
      <header className="px-6 py-5">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span className="h-8 w-8 rounded-md bg-[color:var(--mc-teal)] flex items-center justify-center font-bold text-[color:var(--mc-navy)]">
            M
          </span>
          <span className="font-semibold tracking-tight text-lg">ManualCore</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
          <p className="mt-2 text-white/70">Bienvenida de vuelta.</p>

          <form action={formAction} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm text-white/80">Correo</span>
              <input
                name="email"
                type="email"
                placeholder="tania@empresa.com"
                required
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[color:var(--mc-teal)]"
              />
            </label>
            <label className="block">
              <span className="text-sm text-white/80">Contraseña</span>
              <input
                name="password"
                type="password"
                placeholder="Tu contraseña"
                required
                className="mt-1 w-full rounded-lg bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[color:var(--mc-teal)]"
              />
            </label>

            {state.error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-6 py-3 font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/60">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-[color:var(--mc-teal)] hover:underline">
              Crea una
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
