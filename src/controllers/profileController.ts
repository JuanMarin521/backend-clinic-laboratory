import type { Request, Response } from 'express';

import { UnauthorizedError } from '../exceptions';
import { changePassword, getProfile, updateProfile } from '../services/profileService';
import { asyncHandler } from '../utils/asyncHandler';
import type { ChangePasswordSchema, UpdateProfileSchema } from '../validators/profileValidators';

/** GET /api/v1/profile — perfil completo del paciente autenticado. */
export const getProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  res.status(200).json({ success: true, data: getProfile(req.user.id) });
});

/** PATCH /api/v1/profile — actualiza nombre y datos de contacto. Devuelve el perfil actualizado. */
export const updateProfileHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const input = req.body as UpdateProfileSchema;
  res.status(200).json({ success: true, data: updateProfile(req.user.id, input) });
});

/** PATCH /api/v1/profile/password — cambia la contrasena (exige la actual). */
export const changePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { currentPassword, newPassword } = req.body as ChangePasswordSchema;
  await changePassword(req.user.id, currentPassword, newPassword);

  res.status(200).json({ success: true, data: { message: 'Contrasena actualizada.' } });
});
