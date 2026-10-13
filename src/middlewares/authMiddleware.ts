import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../exceptions';
import { verifyAccessToken } from '../utils/jwt';
import { findUserById } from '../repositories/userRepository';
import { toPublicUser } from '../services/authService';

const BEARER_PREFIX = 'Bearer ';

/**
 * Middleware de autenticacion: exige un header `Authorization: Bearer <token>` valido.
 * Si el token es correcto, adjunta el usuario autenticado en `req.user`
 * para que los controladores protegidos puedan usarlo.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError('Falta el token de autenticacion. Inicia sesion nuevamente.'));
    return;
  }

  const token = authHeader.slice(BEARER_PREFIX.length);

  try {
    const payload = verifyAccessToken(token);
    const user = findUserById(payload.sub);

    if (!user) {
      next(new UnauthorizedError('El usuario del token ya no existe.'));
      return;
    }

    req.user = toPublicUser(user);
    next();
  } catch {
    next(new UnauthorizedError('El token es invalido o ya expiro. Inicia sesion nuevamente.'));
  }
}
