import { appendMessage } from '../repositories/chatRepository';
import type { ChatMessageRecord } from '../types/chat.types';

/** Forma de la respuesta al enviar un mensaje de soporte. */
export interface SendMessageResult {
  userMessage: ChatMessageRecord;
  assistantMessage: ChatMessageRecord;
}

/**
 * Genera la respuesta simulada del asistente "CPO Assist" segun palabras clave
 * del mensaje del paciente. Es una heuristica simple (sin IA real),
 * centralizada aqui para que el mismo criterio sirva a cualquier cliente (app movil, web, etc.).
 */
function buildAssistantReply(userText: string): string {
  const normalizedText = userText.toLowerCase();

  if (normalizedText.includes('resultado')) {
    return 'Tienes examenes en distintos estados: listo, en proceso y con novedad. Puedes verlos en la pestana Resultados.';
  }

  if (normalizedText.includes('lista') || normalizedText.includes('cuando')) {
    return 'Te avisaremos apenas cambie el estado de tu examen. Tambien puedes revisar el semaforo en Resultados.';
  }

  if (normalizedText.includes('sede') || normalizedText.includes('contactar')) {
    return 'Puedes comunicarte con la sede donde te tomaron la muestra. Ellos te daran informacion sobre cualquier novedad.';
  }

  return 'Gracias por tu consulta. Por ahora soy una demostracion, pero pronto podre ayudarte con mas informacion.';
}

/**
 * Procesa un mensaje enviado por el paciente: lo guarda, genera la respuesta
 * del asistente, la guarda tambien, y devuelve ambos mensajes.
 */
export function sendSupportMessage(userId: string, text: string): SendMessageResult {
  const userMessage = appendMessage(userId, 'user', text);
  const assistantMessage = appendMessage(userId, 'assistant', buildAssistantReply(text));

  return { userMessage, assistantMessage };
}
