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

/**
 * Reglas de cada dato del paciente. Se comparten entre el registro (donde son obligatorios)
 * y "Actualizar datos" del Perfil (donde son opcionales).
 */
export const patientFieldRules = {
  fullName: z
    .string({ required_error: 'El nombre completo es obligatorio.' })
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.')
    .max(80, 'El nombre completo no puede tener mas de 80 caracteres.'),
  documentNumber: z
    .string({ required_error: 'El documento es obligatorio.' })
    .trim()
    .regex(/^\d{5,12}$/, 'El documento debe tener entre 5 y 12 digitos, sin puntos.'),
  email: z
    .string({ required_error: 'El correo electronico es obligatorio.' })
    .trim()
    .toLowerCase()
    .email('El correo electronico no es valido.'),
  phone: z
    .string({ required_error: 'El celular es obligatorio.' })
    .trim()
    .regex(/^\d{7,15}$/, 'El celular debe tener entre 7 y 15 digitos.'),
  address: z
    .string({ required_error: 'La direccion es obligatoria.' })
    .trim()
    .min(5, 'La direccion debe tener al menos 5 caracteres.')
    .max(120, 'La direccion no puede tener mas de 120 caracteres.'),
  /** Fecha "YYYY-MM-DD" real (ej. no 2026-02-30) y que no este en el futuro. Se evalua en UTC. */
  birthDate: z
    .string({ required_error: 'La fecha de nacimiento es obligatoria.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.')
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) && date <= new Date();
    }, 'La fecha de nacimiento no es valida.'),
};

/** Reglas de validacion para "Actualizar datos" (PATCH /profile). */
export const updateProfileSchema = z.object({
  fullName: patientFieldRules.fullName,
  documentNumber: optionalText(patientFieldRules.documentNumber),
  email: optionalText(patientFieldRules.email),
  phone: optionalText(patientFieldRules.phone),
  address: optionalText(patientFieldRules.address),
  birthDate: optionalText(patientFieldRules.birthDate),
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
