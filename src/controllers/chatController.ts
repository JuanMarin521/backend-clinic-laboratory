import type { Request, Response } from 'express';

import { UnauthorizedError } from '../exceptions';
import { asyncHandler } from '../utils/asyncHandler';
import { getConversation, sendSupportMessage } from '../services/chatService';
import type { CreateMessageSchema } from '../validators/supportValidators';

/**
 * POST /api/v1/support/messages
 * Recibe el mensaje de un paciente, lo guarda y devuelve la respuesta del asistente
 * (IA con Gemini si hay clave configurada; si no, o si falla, el asistente por palabras clave).
 * (Requiere autenticacion: el mensaje queda asociado al usuario del token).
 */
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  // `authMiddleware` garantiza que `req.user` exista antes de llegar aqui,
  // pero se valida de todas formas para que TypeScript no lo marque como "posiblemente undefined".
  if (!req.user) {
    throw new UnauthorizedError();
  }

  const { text } = req.body as CreateMessageSchema;
  const result = await sendSupportMessage(req.user.id, text);

  res.status(201).json({ success: true, data: result });
});

/**
 * GET /api/v1/support/messages
 * Historial de la conversacion del paciente autenticado (para mostrarlo al abrir el chat).
 */
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  res.status(200).json({ success: true, data: getConversation(req.user.id) });
});
