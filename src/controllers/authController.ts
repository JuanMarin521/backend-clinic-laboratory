import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { loginUser, registerUser } from '../services/authService';
import type { LoginSchema, RegisterSchema } from '../validators/authValidators';

/**
 * POST /api/v1/auth/register
 * Registra un nuevo paciente y devuelve su token de acceso (inicia sesion automaticamente).
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RegisterSchema;
  const result = await registerUser(input);

  res.status(201).json({ success: true, data: result });
});

/**
 * POST /api/v1/auth/login
 * Valida usuario y contrasena, y devuelve el token de acceso.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as LoginSchema;
  const result = await loginUser(input);

  res.status(200).json({ success: true, data: result });
});

//hello world