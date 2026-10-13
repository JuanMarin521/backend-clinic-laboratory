import { z } from 'zod';

import { MAX_CHAT_MESSAGE_LENGTH } from '../config/constants';

/** Reglas de validacion para un mensaje enviado al asistente de soporte. */
export const createMessageSchema = z.object({
  text: z
    .string({ required_error: 'El mensaje no puede estar vacio.' })
    .trim()
    .min(1, 'El mensaje no puede estar vacio.')
    .max(MAX_CHAT_MESSAGE_LENGTH, `El mensaje no puede superar los ${MAX_CHAT_MESSAGE_LENGTH} caracteres.`),
});

export type CreateMessageSchema = z.infer<typeof createMessageSchema>;
