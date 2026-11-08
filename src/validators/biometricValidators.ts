import { z } from 'zod';

import { DEVICE_TOKEN_PATTERN } from '../utils/deviceToken';

const deviceTokenField = z
  .string({ required_error: 'El token del dispositivo es obligatorio.' })
  .regex(DEVICE_TOKEN_PATTERN, 'El token del dispositivo no es valido.');

/** POST /auth/biometric/enroll: exige confirmar la contrasena. */
export const biometricEnrollSchema = z.object({
  password: z.string({ required_error: 'La contrasena es obligatoria.' }).min(1, 'La contrasena es obligatoria.'),
  deviceName: z.string().trim().min(1).max(60).optional().default('Dispositivo movil'),
});

/** POST /auth/biometric/login. */
export const biometricLoginSchema = z.object({ deviceToken: deviceTokenField });

/** POST /auth/biometric/revoke. */
export const biometricRevokeSchema = z.object({
  deviceToken: deviceTokenField,
  reason: z.enum(['disabled', 'logout']).optional().default('disabled'),
});

export type BiometricEnrollSchema = z.infer<typeof biometricEnrollSchema>;
export type BiometricLoginSchema = z.infer<typeof biometricLoginSchema>;
export type BiometricRevokeSchema = z.infer<typeof biometricRevokeSchema>;
