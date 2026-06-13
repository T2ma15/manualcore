// Cliente Anthropic + helpers del brain.
// Modelo fijo a Opus 4.8 (Fable 5 está suspendido en la cuenta; Opus 4.8 es el recomendado).
import Anthropic from "@anthropic-ai/sdk";

export const BRAIN_MODEL = process.env.BRAIN_MODEL ?? "claude-opus-4-8";

// Precios por millón de tokens (Opus 4.8). Para estimar costo por llamada.
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export function anthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] ?? PRICING["claude-opus-4-8"];
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
