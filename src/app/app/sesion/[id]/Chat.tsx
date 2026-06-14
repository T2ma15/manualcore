"use client";

import { useRef, useState } from "react";

type Msg = {
  id?: string;
  role: string;
  msg_type: string;
  content: string;
};

type ImagePayload = {
  data: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
};

// Tipo mínimo para el dictado por voz del navegador (no está en el lib estándar).
type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export default function Chat({
  sessionId,
  initialMessages,
  initialReady = false,
  example,
}: {
  sessionId: string;
  initialMessages: Msg[];
  initialReady?: boolean;
  example?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(initialReady);
  const [recording, setRecording] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<SpeechRec | null>(null);

  async function generateDoc() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/document/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "No se pudo generar");
      }
      const blob = await res.blob();
      const dispo = res.headers.get("Content-Disposition") ?? "";
      const name = dispo.match(/filename="(.+?)"/)?.[1] ?? "documento";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar");
    } finally {
      setGenerating(false);
    }
  }

  // Llamada central al cerebro (texto y/o imagen)
  async function runBrain(payload: { text?: string; image?: ImagePayload; bubble: string }) {
    if (pending) return;
    setError(null);
    setPending(true);
    setMessages((m) => [...m, { role: "engineer", msg_type: "free_text", content: payload.bubble }]);
    setText("");

    try {
      const res = await fetch("/api/brain/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text: payload.text ?? "", image: payload.image }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setMessages((m) => [...m, ...data.messages]);
      setReady(Boolean(data.ready));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal");
    } finally {
      setPending(false);
    }
  }

  function send() {
    const value = text.trim();
    if (!value) return;
    runBrain({ text: value, bubble: value });
  }

  // Importar foto / imagen → el cerebro la lee (Opus 4.8 ve imágenes)
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permitir re-seleccionar el mismo archivo
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Formato no soportado. Usa una foto JPG, PNG, GIF o WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es muy grande (máximo 5 MB). Tómala con menos resolución.");
      return;
    }

    const dataUrl: string = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("No se pudo leer la imagen"));
      r.readAsDataURL(file);
    });
    const base64 = dataUrl.split(",")[1] ?? "";

    runBrain({
      text: text.trim(),
      image: { data: base64, mediaType: file.type as ImagePayload["mediaType"] },
      bubble: text.trim() ? `📷 ${text.trim()}` : "📷 (foto enviada)",
    });
  }

  // Dictado por voz (navegador) → escribe en la caja
  function toggleVoice() {
    if (recording) {
      recRef.current?.stop();
      return;
    }
    const Ctor =
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec; SpeechRecognition?: new () => SpeechRec })
        .webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: new () => SpeechRec }).SpeechRecognition;
    if (!Ctor) {
      setError("Tu navegador no soporta dictado por voz. Usa Chrome.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "es-DO";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      let nuevo = "";
      for (let i = 0; i < ev.results.length; i++) nuevo += ev.results[i][0].transcript + " ";
      setText((prev) => (prev ? prev + " " : "") + nuevo.trim());
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recRef.current = rec;
    rec.start();
    setRecording(true);
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {empty && (
          <div className="text-[color:var(--mc-steel)] space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💬</span>
              <p className="text-sm">
                Cuéntame el proceso en tus palabras — como se lo explicarías a un
                compañero nuevo. No tienes que saber documentar; yo me encargo de
                eso y te pregunto lo que falte.
              </p>
            </div>

            {example && (
              <div className="rounded-xl border border-[color:var(--mc-border)] bg-[color:var(--mc-muted)] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide mb-1">
                  Ejemplo — así de simple
                </p>
                <p className="text-sm italic text-[color:var(--mc-ink)]">“{example}”</p>
                <button
                  type="button"
                  onClick={() => setText(example)}
                  className="mt-2 text-xs font-semibold text-[color:var(--mc-teal)] hover:underline"
                >
                  Usar este ejemplo para empezar →
                </button>
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={m.id ?? i} msg={m} />
        ))}

        {pending && (
          <div className="text-sm text-[color:var(--mc-steel)] animate-pulse">
            El asistente está leyendo…
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
          {error}
        </p>
      )}

      {ready && (
        <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-emerald-800">
            <span className="font-semibold">¡Listo!</span> Tengo todo lo necesario para tu documento.
          </p>
          <button
            onClick={generateDoc}
            disabled={generating}
            className="rounded-full bg-[color:var(--mc-navy)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {generating ? "Generando…" : "Generar documento"}
          </button>
        </div>
      )}

      <div className="mt-3 border-t border-[color:var(--mc-border)] pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
          }}
          rows={3}
          placeholder="Describe el proceso, dicta por voz 🎤 o sube una foto 📷… (Ctrl+Enter para enviar)"
          className="w-full rounded-lg border border-[color:var(--mc-border)] px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--mc-teal)] resize-none"
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickImage}
          className="hidden"
        />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            {/* Voz */}
            <button
              type="button"
              onClick={toggleVoice}
              disabled={pending}
              title="Dictar por voz"
              className={`rounded-full border px-3 py-2 text-sm transition disabled:opacity-40 ${
                recording
                  ? "border-red-400 bg-red-50 text-red-600 animate-pulse"
                  : "border-[color:var(--mc-border)] hover:border-[color:var(--mc-teal)]"
              }`}
            >
              {recording ? "● Grabando…" : "🎤 Voz"}
            </button>
            {/* Foto / imagen */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={pending}
              title="Subir una foto del proceso (escrito a mano, pizarra, formato)"
              className="rounded-full border border-[color:var(--mc-border)] px-3 py-2 text-sm hover:border-[color:var(--mc-teal)] transition disabled:opacity-40"
            >
              📷 Foto
            </button>
          </div>

          <button
            onClick={send}
            disabled={pending || !text.trim()}
            className="rounded-full bg-[color:var(--mc-teal)] text-[color:var(--mc-navy)] px-6 py-2 font-semibold text-sm hover:opacity-90 disabled:opacity-40"
          >
            {pending ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === "engineer") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[color:var(--mc-navy)] text-white px-4 py-2 text-sm whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  // Mensajes del brain — color por tipo
  const styles: Record<string, string> = {
    question: "border-amber-300 bg-amber-50",
    confirmation: "border-emerald-300 bg-emerald-50",
    free_text: "border-[color:var(--mc-border)] bg-white",
    system: "border-[color:var(--mc-border)] bg-[color:var(--mc-muted)]",
  };
  const label: Record<string, string> = {
    question: "Pregunta",
    confirmation: "Confirmado",
  };

  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-2 text-sm whitespace-pre-wrap ${
          styles[msg.msg_type] ?? styles.free_text
        }`}
      >
        {label[msg.msg_type] && (
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--mc-steel)] mb-1">
            {label[msg.msg_type]}
          </span>
        )}
        {msg.content}
      </div>
    </div>
  );
}
