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

// Íconos de línea finos (sin emojis) — heredan color y tamaño del contexto.
function IMic({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 19v3" />
    </svg>
  );
}
function ICamera({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" /><circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}
function IArrow({ s = 15 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  );
}
function IChecks({ s = 16 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 12 5 5L18 6" /><path d="m16 16 1 1 5-5" />
    </svg>
  );
}
function ILock({ s = 13 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function Chat({
  sessionId,
  initialMessages,
  initialReady = false,
  example,
  codePrefix = "DOC",
  initialApproved = false,
  initialDocNumber = "",
}: {
  sessionId: string;
  initialMessages: Msg[];
  initialReady?: boolean;
  example?: string;
  codePrefix?: string;
  initialApproved?: boolean;
  initialDocNumber?: string;
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

  // Aprobación + numeración
  const [showApprove, setShowApprove] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(initialApproved);
  const [approvedCode, setApprovedCode] = useState(initialDocNumber);
  const [code, setCode] = useState(initialDocNumber || `${codePrefix}-001`);
  const [ownerName, setOwnerName] = useState("");
  const [approverName, setApproverName] = useState("");
  const [reviewDue, setReviewDue] = useState("");

  async function approve() {
    if (approving) return;
    if (!code.trim() || !ownerName.trim() || !approverName.trim() || !reviewDue) {
      setError("Completa el código, quién elaboró, quién aprobó y la fecha de revisión.");
      return;
    }
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/document/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          docNumber: code.trim(),
          ownerName: ownerName.trim(),
          approverName: approverName.trim(),
          reviewDue,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "No se pudo aprobar");
      setApproved(true);
      setApprovedCode(d.docNumber);
      setShowApprove(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo aprobar");
    } finally {
      setApproving(false);
    }
  }

  async function generateDoc(format?: "pdf") {
    if (generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/document/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, format }),
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
      bubble: text.trim() ? text.trim() : "Foto enviada",
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
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {empty && (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-[color:var(--mc-ink)]">
              Cuéntame el proceso en tus palabras — como se lo explicarías a un compañero
              nuevo. No tienes que saber documentar; yo me encargo y te pregunto lo que falte.
            </p>

            {example && (
              <div className="rounded-[10px] border border-[color:var(--mc-border)] bg-[color:var(--mc-muted)] p-3.5">
                <p className="text-[11px] tracking-[0.04em] text-[color:var(--mc-steel)] mb-1.5">
                  Ejemplo
                </p>
                <p className="text-[13px] italic leading-relaxed text-[color:var(--mc-ink)]">
                  “{example}”
                </p>
                <button
                  type="button"
                  onClick={() => setText(example)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-[color:var(--mc-teal)] hover:underline"
                >
                  Usar este ejemplo <IArrow s={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <Bubble key={m.id ?? i} msg={m} />
        ))}

        {pending && (
          <div className="flex items-center gap-2 text-[12.5px] text-[color:var(--mc-steel)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--mc-teal)] animate-pulse" />
            El asistente está leyendo…
          </div>
        )}
      </div>

      {error && (
        <p className="text-[12.5px] text-[#B3261E] bg-[#FCEDED] border border-[#F2D6D6] rounded-[10px] px-3.5 py-2.5 mt-3">
          {error}
        </p>
      )}

      {approved ? (
        <div className="mt-3 rounded-[12px] border border-[color:var(--mc-border)] bg-[color:var(--mc-muted)] px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[13px] text-[color:var(--mc-ink)]">
            <span className="text-[color:var(--mc-teal)]">
              <IChecks s={16} />
            </span>
            <span>
              <span className="font-semibold">Aprobado</span> · código{" "}
              <span className="font-mono text-[12.5px]">{approvedCode}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => generateDoc()}
              disabled={generating}
              className="rounded-[8px] bg-[color:var(--mc-navy)] text-white px-4 py-2 text-[13px] font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {generating ? "Generando…" : "Descargar"}
            </button>
            <button
              onClick={() => generateDoc("pdf")}
              disabled={generating}
              title="PDF con pie de trazabilidad de impresión (quién imprimió, copia #)"
              className="rounded-[8px] border border-[color:var(--mc-border)] text-[color:var(--mc-navy)] px-4 py-2 text-[13px] font-medium hover:border-[color:var(--mc-navy)] disabled:opacity-50 whitespace-nowrap"
            >
              PDF trazable
            </button>
          </div>
        </div>
      ) : ready ? (
        <div className="mt-3 rounded-[12px] border border-[color:var(--mc-border)] bg-white px-4 py-3.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="flex items-center gap-2 text-[13px] text-[color:var(--mc-ink)]">
              <span className="text-[color:var(--mc-teal)]">
                <IChecks s={16} />
              </span>
              <span className="font-medium">Tengo todo lo necesario.</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => generateDoc()}
                disabled={generating}
                className="rounded-[8px] border border-[color:var(--mc-border)] text-[color:var(--mc-navy)] px-4 py-2 text-[13px] font-medium hover:border-[color:var(--mc-navy)] disabled:opacity-50 whitespace-nowrap"
              >
                {generating ? "Generando…" : "Generar borrador"}
              </button>
              <button
                onClick={() => setShowApprove((s) => !s)}
                className="rounded-[8px] bg-[color:var(--mc-navy)] text-white px-4 py-2 text-[13px] font-medium hover:opacity-90 whitespace-nowrap"
              >
                Aprobar y numerar
              </button>
            </div>
          </div>

          {showApprove && (
            <div className="mt-3.5 border-t border-[color:var(--mc-border)] pt-3.5 space-y-2.5">
              <Field label="Código del documento (editable)">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full rounded-[8px] border border-[color:var(--mc-border)] px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-[color:var(--mc-teal)]"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-2.5">
                <Field label="Elaboró">
                  <input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Nombre"
                    className="w-full rounded-[8px] border border-[color:var(--mc-border)] px-3 py-2 text-[13px] focus:outline-none focus:border-[color:var(--mc-teal)]"
                  />
                </Field>
                <Field label="Aprobó">
                  <input
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="Nombre"
                    className="w-full rounded-[8px] border border-[color:var(--mc-border)] px-3 py-2 text-[13px] focus:outline-none focus:border-[color:var(--mc-teal)]"
                  />
                </Field>
              </div>
              <Field label="Fecha de próxima revisión">
                <input
                  type="date"
                  value={reviewDue}
                  onChange={(e) => setReviewDue(e.target.value)}
                  className="w-full rounded-[8px] border border-[color:var(--mc-border)] px-3 py-2 text-[13px] focus:outline-none focus:border-[color:var(--mc-teal)]"
                />
              </Field>
              {ownerName.trim() && ownerName.trim() === approverName.trim() && (
                <p className="text-[12px] text-[#8A6D1A] bg-[#FBF3DD] border border-[#EFE2BC] rounded-[8px] px-3 py-2">
                  Buena práctica: que elabore y apruebe <strong>personas distintas</strong>. Puedes
                  continuar, pero un auditor lo valora.
                </p>
              )}
              <button
                onClick={approve}
                disabled={approving}
                className="w-full rounded-[8px] bg-[color:var(--mc-navy)] text-white px-4 py-2.5 text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
              >
                {approving ? "Aprobando…" : "Confirmar aprobación"}
              </button>
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-3 pt-3 border-t border-[color:var(--mc-border)]">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPickImage}
          className="hidden"
        />

        <div className="rounded-[12px] border border-[color:var(--mc-border)] bg-white px-3.5 py-3 focus-within:border-[color:var(--mc-teal)] transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={2}
            placeholder="Describe el proceso en tus palabras, como a un compañero nuevo…"
            className="w-full bg-transparent text-[13.5px] leading-relaxed text-[color:var(--mc-ink)] placeholder:text-[color:var(--mc-steel)]/55 resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoice}
                disabled={pending}
                title="Dictar por voz"
                className={`inline-flex items-center gap-1.5 rounded-[8px] border px-3 py-1.5 text-[13px] transition disabled:opacity-40 ${
                  recording
                    ? "border-[#D9534F] text-[#C0392B] bg-[#FCEDED]"
                    : "border-[color:var(--mc-border)] text-[color:var(--mc-steel)] hover:border-[color:var(--mc-teal)] hover:text-[color:var(--mc-navy)]"
                }`}
              >
                {recording ? (
                  <>
                    <span className="inline-block w-2 h-2 rounded-full bg-[#C0392B] animate-pulse" /> Grabando…
                  </>
                ) : (
                  <>
                    <IMic /> Voz
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                title="Subir una foto del proceso (escrito a mano, pizarra, formato)"
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[color:var(--mc-border)] px-3 py-1.5 text-[13px] text-[color:var(--mc-steel)] hover:border-[color:var(--mc-teal)] hover:text-[color:var(--mc-navy)] transition disabled:opacity-40"
              >
                <ICamera /> Foto
              </button>
            </div>

            <button
              onClick={send}
              disabled={pending || !text.trim()}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-[color:var(--mc-navy)] text-white px-4 py-2 text-[13px] font-medium hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "Enviando…" : (
                <>
                  Enviar <IArrow />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-[color:var(--mc-steel)]/80">
          <ILock /> Nada se aprueba sin tu revisión · ⌘/Ctrl + Enter para enviar
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-[0.03em] text-[color:var(--mc-steel)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === "engineer") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[12px] rounded-br-[4px] bg-[color:var(--mc-navy)] text-white/95 px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  const isQuestion = msg.msg_type === "question";
  const isConfirm = msg.msg_type === "confirmation";

  return (
    <div>
      <p className="text-[11px] tracking-[0.04em] text-[color:var(--mc-steel)] mb-1.5 ml-0.5">
        Asistente
      </p>
      <div
        className={`bg-white border border-[color:var(--mc-border)] px-3.5 py-3 ${
          isQuestion
            ? "border-l-2 border-l-[color:var(--mc-teal)] rounded-r-[10px] rounded-l-[2px]"
            : "rounded-[10px]"
        }`}
      >
        {isQuestion && (
          <span className="inline-block mb-2 text-[10.5px] text-[#0F6E56] bg-[color:var(--mc-teal-soft)] rounded-[5px] px-1.5 py-0.5">
            Pregunta
          </span>
        )}
        {isConfirm && (
          <span className="inline-flex items-center gap-1.5 mb-2 text-[10.5px] text-[color:var(--mc-steel)]">
            <span className="text-[color:var(--mc-teal)]">
              <IChecks s={14} />
            </span>
            Registrado
          </span>
        )}
        <div className="text-[13.5px] leading-[1.55] text-[color:var(--mc-ink)] whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    </div>
  );
}
