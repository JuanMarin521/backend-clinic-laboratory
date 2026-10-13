import { generateId } from '../utils/ids';
import type { ChatMessageRecord, ChatSender } from '../types/chat.types';

/**
 * "Base de datos" en memoria de mensajes de soporte, agrupados por usuario.
 * La clave del mapa es el id del usuario autenticado.
 */
const conversationsByUser = new Map<string, ChatMessageRecord[]>();

/** Agrega un mensaje a la conversacion del usuario y lo devuelve ya guardado. */
export function appendMessage(userId: string, sender: ChatSender, text: string): ChatMessageRecord {
  const message: ChatMessageRecord = {
    id: generateId('msg'),
    userId,
    sender,
    text,
    createdAt: new Date().toISOString(),
  };

  const history = conversationsByUser.get(userId) ?? [];
  history.push(message);
  conversationsByUser.set(userId, history);

  return message;
}

/** Devuelve el historial completo de mensajes de un usuario (vacio si nunca escribio). */
export function findConversationByUserId(userId: string): ChatMessageRecord[] {
  return conversationsByUser.get(userId) ?? [];
}
