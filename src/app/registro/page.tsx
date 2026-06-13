"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/auth/actions";

const initial: AuthState = { error: null };

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(signUp, initial);

  if (state.checkEmail) {
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
          <div className="w-full max-w-md text-center">
            <div className="text-5xl">📬</div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">
              Revisa tu correo
            </h1>
            <p className="mt-3 text-white/70">
              Te enviamos un enlace para confirmar tu cuenta. Ábrelo y luego
              inicia sesión.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-6 py-3 font-semibold hover:opacity-90"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
          <p className="mt-2 text-white/70">
            Documenta tus procesos con un asistente que sabe lo que falta.
          </p>

          <form action={formAction} className="mt-8 space-y-4">
            <Field label="Nombre de tu empresa" name="company_name" placeholder="Industrias Quisqueya SRL" />
            <Field label="Tu nombre completo" name="full_name" placeholder="Tania Mateo" />
            <Field label="Correo" name="email" type="email" placeholder="tania@empresa.com" />
            <Field label="Contraseña" name="password" type="password" placeholder="Mínimo 8 caracteres" />

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
              {pending ? "Creando..." : "Crear cuenta"}
            </button>
          </form>

          <p className="mt-6 text-sm text-white/60">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[color:var(--mc-teal)] hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/80">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="mt-1 w-full rounded-lg bg-white/5 border border-white/15 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[color:var(--mc-teal)]"
      />
    </label>
  );
}
