"use client";

import { useState } from "react";

type Msg = {
  id?: string;
  role: string;
  msg_type: string;
  content: string;
};

export default function Chat({
  sessionId,
  initialMessages,
  initialReady = false,
}: {
  sessionId: string;
  initialMessages: Msg[];
  initialReady?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(initialReady);

  async function send() {
    const value = text.trim();
    if (!value || pending) return;
    setError(null);
    setPending(true);

    // Mostrar el mensaje del usuario de inmediato (optimista)
    setMessages((m) => [...m, { role: "engineer", msg_type: "free_text", content: value }]);
    setText("");

    try {
      const res = await fetch("/api/brain/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text: value }),
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

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {empty && (
          <div className="h-full flex items-center justify-center text-center text-[color:var(--mc-steel)]">
            <div>
              <div className="text-4xl">💬</div>
              <p className="mt-3 max-w-sm">
                Cuéntame el proceso en tus palabras — pega o escribe abajo. Yo
                extraigo lo que pueda y te pregunto lo que falte.
              </p>
            </div>
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
            disabled
            title="El generador de documentos se activa en el siguiente paso"
            className="rounded-full bg-[color:var(--mc-navy)] text-white px-4 py-2 text-sm font-semibold opacity-50 cursor-not-allowed whitespace-nowrap"
          >
            Generar documento
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
          placeholder="Describe el proceso… (Ctrl+Enter para enviar)"
          className="w-full rounded-lg border border-[color:var(--mc-border)] px-3 py-2 text-sm focus:outline-none focus:border-[color:var(--mc-teal)] resize-none"
        />
        <div className="flex justify-end mt-2">
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
