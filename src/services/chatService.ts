import { AI_HISTORY_MESSAGES } from '../config/constants';
import { appendMessage, findConversationByUserId } from '../repositories/chatRepository';
import type { ChatMessageRecord } from '../types/chat.types';
import { buildSystemPrompt, toConversationTurns, toPlainReply } from './assistant/assistantPrompt';
import { assertChatRateLimit } from './assistant/chatRateLimiter';
import { generateGeminiReply, isGeminiConfigured } from './assistant/geminiClient';
import { buildKeywordReply } from './assistant/keywordAssistant';

/** Forma de la respuesta al enviar un mensaje de soporte. */
export interface SendMessageResult {
  userMessage: ChatMessageRecord;
  assistantMessage: ChatMessageRecord;
}

/**
 * Genera la respuesta de Polito, el asistente virtual del CPO.
 * - Con GEMINI_API_KEY: responde la IA, con las reglas del asistente, los datos del paciente
 *   y los ultimos mensajes de la conversacion.
 * - Sin clave, o si la IA falla: responde el asistente por palabras clave.
 */
async function buildAssistantReply(userId: string, history: ChatMessageRecord[], text: string): Promise<string> {
  if (!isGeminiConfigured()) return buildKeywordReply(text);

  try {
    const reply = await generateGeminiReply(buildSystemPrompt(userId), toConversationTurns(history, text));
    return toPlainReply(reply);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      '[chat] La IA no respondio; se usa el asistente de respaldo:',
      error instanceof Error ? error.message : error,
    );
    return buildKeywordReply(text);
  }
}

/**
 * Procesa un mensaje enviado por el paciente: aplica el limite por minuto, lo guarda,
 * genera la respuesta del asistente, la guarda tambien, y devuelve ambos mensajes.
 */
export async function sendSupportMessage(userId: string, text: string): Promise<SendMessageResult> {
  assertChatRateLimit(userId);

  const history = findConversationByUserId(userId).slice(-AI_HISTORY_MESSAGES);
  const userMessage = appendMessage(userId, 'user', text);
  const assistantMessage = appendMessage(userId, 'assistant', await buildAssistantReply(userId, history, text));

  return { userMessage, assistantMessage };
}

/** Cuantos mensajes del historial se devuelven como maximo (los mas recientes). */
const MAX_HISTORY_MESSAGES = 100;

/** Historial de la conversacion del paciente, en orden cronologico (los ultimos MAX_HISTORY_MESSAGES). */
export function getConversation(userId: string): ChatMessageRecord[] {
  return findConversationByUserId(userId).slice(-MAX_HISTORY_MESSAGES);
}
