import type { Request, Response } from 'express';

import { UnauthorizedError } from '../exceptions';
import { enrollDevice, loginWithDeviceToken, revokeDeviceToken } from '../services/biometricAuthService';
import { asyncHandler } from '../utils/asyncHandler';
import type {
  BiometricEnrollSchema,
  BiometricLoginSchema,
  BiometricRevokeSchema,
} from '../validators/biometricValidators';

/** POST /api/v1/auth/biometric/enroll — activa el ingreso biometrico en este dispositivo. */
export const enrollBiometric = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { password, deviceName } = req.body as BiometricEnrollSchema;
  const result = await enrollDevice(req.user.id, password, deviceName);
  res.status(201).json({ success: true, data: result });
});

/** POST /api/v1/auth/biometric/login — inicia sesion con el token del dispositivo (y lo rota). */
export const loginBiometric = asyncHandler(async (req: Request, res: Response) => {
  const { deviceToken } = req.body as BiometricLoginSchema;
  res.status(200).json({ success: true, data: loginWithDeviceToken(deviceToken) });
});

/** POST /api/v1/auth/biometric/revoke — desactiva el ingreso biometrico de este dispositivo. */
export const revokeBiometric = asyncHandler(async (req: Request, res: Response) => {
  const { deviceToken, reason } = req.body as BiometricRevokeSchema;
  revokeDeviceToken(deviceToken, reason);
  // Siempre 204: no se revela si el token existia o no.
  res.status(204).send();
});
