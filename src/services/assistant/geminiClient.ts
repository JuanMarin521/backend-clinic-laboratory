import { AI_TIMEOUT_MS } from '../../config/constants';
import { env } from '../../config/env';

/**
 * Cliente minimo de la API de Google Gemini (endpoint REST `generateContent`).
 * Es el UNICO archivo que conoce el formato de Gemini: si mas adelante se cambia de proveedor,
 * solo se reemplaza este archivo y el resto del chat sigue igual.
 *
 * La clave vive SOLO en el `.env` del servidor y viaja en un header (no en la URL),
 * para que no quede escrita en logs. Nunca se envia a la app.
 */

/** Un turno de la conversacion tal como lo entiende Gemini ("model" es el asistente). */
export interface ConversationTurn {
  role: 'user' | 'model';
  text: string;
}

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Tope de tokens de salida. Es holgado a proposito: los modelos recientes "piensan" antes de
 * responder y ese razonamiento tambien cuenta; si el tope es muy bajo la respuesta llega vacia.
 * El largo real de la respuesta lo controlan las instrucciones ("maximo 3 oraciones").
 */
const MAX_OUTPUT_TOKENS = 1024;

/** Temperatura baja: respuestas mas consistentes y menos "creativas" (importante en salud). */
const TEMPERATURE = 0.3;

/** Partes de la respuesta de Gemini que nos interesan. */
interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/** Indica si hay una clave configurada. Sin clave, el chat usa el asistente por palabras clave. */
export function isGeminiConfigured(): boolean {
  return env.geminiApiKey.length > 0;
}

/**
 * Pide a Gemini la respuesta del asistente.
 * Lanza un error si la API falla, tarda mas de AI_TIMEOUT_MS o no devuelve texto;
 * quien la llama decide que hacer en ese caso (el chat usa el asistente de respaldo).
 */
export async function generateGeminiReply(systemPrompt: string, turns: ConversationTurn[]): Promise<string> {
  const response = await fetch(`${GEMINI_BASE_URL}/${encodeURIComponent(env.geminiModel)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.geminiApiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      generationConfig: { temperature: TEMPERATURE, maxOutputTokens: MAX_OUTPUT_TOKENS },
    }),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Solo el codigo HTTP: el cuerpo del error podria traer datos que no queremos en los logs.
    throw new Error(`Gemini respondio con HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const candidate = payload.candidates?.[0];
  const text = (candidate?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    const reason = payload.promptFeedback?.blockReason ?? candidate?.finishReason ?? 'sin motivo';
    throw new Error(`Gemini no devolvio texto (${reason}).`);
  }

  return text;
}
