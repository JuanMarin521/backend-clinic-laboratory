import { db } from '../config/database';
import type { ChatMessageRecord, ChatSender } from '../types/chat.types';

/**
 * Repositorio de mensajes de soporte, respaldado por una base de datos SQLite real
 * (tabla `chat_messages`). A diferencia de la version en memoria, el historial de
 * conversaciones ahora persiste entre reinicios del servidor.
 */

/** Forma cruda de una fila de la tabla `chat_messages`. */
interface ChatMessageRow {
  id: string;
  user_id: string;
  sender: string;
  text: string;
  created_at: string;
}

/** Convierte una fila de la base de datos al tipo `ChatMessageRecord` que usa el resto del codigo. */
function toChatMessageRecord(row: ChatMessageRow): ChatMessageRecord {
  return {
    id: row.id,
    userId: row.user_id,
    sender: row.sender as ChatSender,
    text: row.text,
    createdAt: row.created_at,
  };
}

/** Agrega un mensaje a la conversacion del usuario y lo devuelve ya guardado. */
export function appendMessage(userId: string, sender: ChatSender, text: string): ChatMessageRecord {
  const message: ChatMessageRecord = {
    id: `msg_${Date.now()}_${Math.round(Math.random() * 1_000_000)}`,
    userId,
    sender,
    text,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    'INSERT INTO chat_messages (id, user_id, sender, text, created_at) VALUES (@id, @userId, @sender, @text, @createdAt)',
  ).run(message);

  return message;
}

/** Devuelve el historial completo de mensajes de un usuario (vacio si nunca escribio), en orden cronologico. */
export function findConversationByUserId(userId: string): ChatMessageRecord[] {
  const rows = db
    .prepare<[string], ChatMessageRow>('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC')
    .all(userId);

  return rows.map(toChatMessageRecord);
}
