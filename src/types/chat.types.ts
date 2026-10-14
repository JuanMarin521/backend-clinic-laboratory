export type ChatSender = 'assistant' | 'user';

/** Representa un mensaje dentro de una conversacion de soporte. */
export interface ChatMessageRecord {
  id: string;
  userId: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
}
