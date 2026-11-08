import { z } from 'zod';

import { MIN_PASSWORD_LENGTH, MIN_USERNAME_LENGTH } from '../config/constants';
import { patientFieldRules } from './profileValidators';

/**
 * Reglas de validacion para el registro de un nuevo paciente.
 * Ademas de usuario y contrasena, todos los datos personales son obligatorios.
 */
export const registerSchema = z.object({
  fullName: patientFieldRules.fullName,
  username: z
    .string({ required_error: 'El usuario es obligatorio.' })
    .trim()
    .min(MIN_USERNAME_LENGTH, `El usuario debe tener al menos ${MIN_USERNAME_LENGTH} caracteres.`)
    .regex(/^[A-Za-z0-9._-]+$/, 'El usuario solo puede contener letras, numeros, puntos, guiones y guion bajo.'),
  password: z
    .string({ required_error: 'La contrasena es obligatoria.' })
    .min(MIN_PASSWORD_LENGTH, `La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`),
  documentNumber: patientFieldRules.documentNumber,
  birthDate: patientFieldRules.birthDate,
  phone: patientFieldRules.phone,
  email: patientFieldRules.email,
  address: patientFieldRules.address,
});

/** Reglas de validacion para el inicio de sesion. */
export const loginSchema = z.object({
  username: z.string({ required_error: 'El usuario es obligatorio.' }).trim().min(1, 'El usuario es obligatorio.'),
  password: z.string({ required_error: 'La contrasena es obligatoria.' }).min(1, 'La contrasena es obligatoria.'),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
