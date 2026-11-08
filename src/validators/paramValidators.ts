import { z } from 'zod';

/** Valida que el parametro de ruta `examId` venga presente y no vacio. */
export const examIdParamSchema = z.object({
  examId: z.string().trim().min(1, 'El identificador del examen es obligatorio.'),
});

/** Valida que el parametro de ruta `orderNumber` sea un numero de orden de 6 digitos. */
export const orderNumberParamSchema = z.object({
  orderNumber: z.string().regex(/^\d{6}$/, 'El numero de orden debe tener 6 digitos.'),
});
