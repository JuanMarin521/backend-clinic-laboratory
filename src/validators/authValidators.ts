import { z } from 'zod';

import { MIN_PASSWORD_LENGTH, MIN_USERNAME_LENGTH } from '../config/constants';

/** Reglas de validacion para el registro de un nuevo usuario. */
export const registerSchema = z.object({
  fullName: z
    .string({ required_error: 'El nombre completo es obligatorio.' })
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres.'),
  username: z
    .string({ required_error: 'El usuario es obligatorio.' })
    .trim()
    .min(MIN_USERNAME_LENGTH, `El usuario debe tener al menos ${MIN_USERNAME_LENGTH} caracteres.`)
    .regex(/^[A-Za-z0-9._-]+$/, 'El usuario solo puede contener letras, numeros, puntos, guiones y guion bajo.'),
  password: z
    .string({ required_error: 'La contrasena es obligatoria.' })
    .min(MIN_PASSWORD_LENGTH, `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
});

/** Reglas de validacion para el inicio de sesion. */
export const loginSchema = z.object({
  username: z.string({ required_error: 'El usuario es obligatorio.' }).trim().min(1, 'El usuario es obligatorio.'),
  password: z.string({ required_error: 'La contrasena es obligatoria.' }).min(1, 'La contrasena es obligatoria.'),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
