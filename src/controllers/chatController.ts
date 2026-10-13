import type { Request, Response } from 'express';

import { UnauthorizedError } from '../exceptions';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSupportMessage } from '../services/chatService';
import type { CreateMessageSchema } from '../validators/supportValidators';

/**
 * POST /api/v1/support/messages
 * Recibe el mensaje de un paciente, lo guarda y devuelve la respuesta simulada del asistente.
 * (Requiere autenticacion: el mensaje queda asociado al usuario del token).
 */
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
  // `authMiddleware` garantiza que `req.user` exista antes de llegar aqui,
  // pero se valida de todas formas para que TypeScript no lo marque como "posiblemente undefined".
  if (!req.user) {
    throw new UnauthorizedError();
  }

  const { text } = req.body as CreateMessageSchema;
  const result = sendSupportMessage(req.user.id, text);

  res.status(201).json({ success: true, data: result });
});
