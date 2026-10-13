import { z } from 'zod';

/** Valida que el parametro de ruta `examId` venga presente y no vacio. */
export const examIdParamSchema = z.object({
  examId: z.string().trim().min(1, 'El identificador del examen es obligatorio.'),
});
