import { MAX_CHAT_MESSAGES_PER_MINUTE } from '../../config/constants';
import { TooManyRequestsError } from '../../exceptions';

/**
 * Limite de mensajes por paciente (ventana de 1 minuto, en memoria).
 * Evita que un paciente (o un script con su token) agote la cuota gratuita de la IA.
 * Al reiniciar el servidor el conteo vuelve a cero, lo cual es aceptable para este limite.
 */
const WINDOW_MS = 60_000;
const recentMessagesByUser = new Map<string, number[]>();

/** Registra un mensaje del paciente o lanza 429 si ya envio demasiados en el ultimo minuto. */
export function assertChatRateLimit(userId: string): void {
  const now = Date.now();
  const recent = (recentMessagesByUser.get(userId) ?? []).filter((sentAt) => now - sentAt < WINDOW_MS);

  if (recent.length >= MAX_CHAT_MESSAGES_PER_MINUTE) {
    recentMessagesByUser.set(userId, recent);
    throw new TooManyRequestsError('Estas enviando mensajes muy rapido. Espera un momento e intenta de nuevo.');
  }

  recent.push(now);
  recentMessagesByUser.set(userId, recent);
}
