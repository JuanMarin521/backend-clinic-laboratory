import { z } from 'zod';

import { MIN_PASSWORD_LENGTH } from '../config/constants';

/**
 * Campo de texto opcional: si llega vacio (o solo espacios) se guarda como `null`,
 * asi el paciente puede "borrar" un dato dejando el campo en blanco.
 */
function optionalText<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    schema.nullable().optional().transform((value) => value ?? null),
  );
}

/** Fecha "YYYY-MM-DD" valida y que no este en el futuro. */
const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) && date <= new Date();
  }, 'La fecha de nacimiento no es valida.');

/** Reglas de validacion para "Actualizar datos" (PATCH /profile). */
export const updateProfileSchema = z.object({
  fullName: z
    .string({ required_error: 'El nombre completo es obligatorio.' })
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(80, 'El nombre completo no puede tener mas de 80 caracteres.'),
  documentNumber: optionalText(
    z.string().trim().regex(/^\d{5,12}$/, 'El documento debe tener entre 5 y 12 digitos, sin puntos.'),
  ),
  email: optionalText(z.string().trim().toLowerCase().email('El correo electronico no es valido.')),
  phone: optionalText(z.string().trim().regex(/^\d{7,15}$/, 'El celular debe tener entre 7 y 15 digitos.')),
  address: optionalText(z.string().trim().max(120, 'La direccion no puede tener mas de 120 caracteres.')),
  birthDate: optionalText(birthDateSchema),
});

/** Reglas de validacion para el cambio de contrasena (PATCH /profile/password). */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'La contrasena actual es obligatoria.' })
    .min(1, 'La contrasena actual es obligatoria.'),
  newPassword: z
    .string({ required_error: 'La nueva contrasena es obligatoria.' })
    .min(MIN_PASSWORD_LENGTH, `La nueva contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
