import type { PublicUser } from './user.types';

/**
 * Extiende el tipo `Request` de Express para incluir el usuario autenticado.
 * `authMiddleware` es quien asigna este valor luego de verificar el token JWT.
 */
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export {};
