"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoUploader({ initialLogo }: { initialLogo: string | null }) {
  const router = useRouter();
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|gif)$/.test(file.type)) {
      setError("Usa una imagen PNG, JPG o GIF.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const dataUrl = await downscale(file, 400);
      const res = await fetch("/api/tenant/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "No se pudo guardar");
      }
      setLogo(dataUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error subiendo el logo");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/tenant/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: null }),
      });
      setLogo(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl bg-white border border-[color:var(--mc-border)] px-4 py-4 flex items-center gap-4">
      <div className="h-14 w-28 rounded-lg border border-dashed border-[color:var(--mc-border)] bg-[color:var(--mc-muted)] flex items-center justify-center overflow-hidden shrink-0">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="Logo" className="max-h-12 max-w-24 object-contain" />
        ) : (
          <span className="text-xs text-[color:var(--mc-steel)]">Sin logo</span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-[color:var(--mc-navy)]">Logo de tu empresa</p>
        <p className="text-xs text-[color:var(--mc-steel)] mt-0.5">
          Aparecerá en todos tus documentos. PNG o JPG con fondo claro funciona mejor.
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-full bg-[color:var(--mc-navy)] text-white px-4 py-1.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? "..." : logo ? "Cambiar" : "Subir logo"}
        </button>
        {logo && (
          <button
            onClick={remove}
            disabled={busy}
            className="text-xs text-[color:var(--mc-steel)] hover:underline"
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

// Reduce la imagen a un ancho máximo y la devuelve como data URL (mantiene tamaño chico).
function downscale(file: File, maxW: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}
