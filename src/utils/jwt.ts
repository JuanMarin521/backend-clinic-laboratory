import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import type { PublicUser } from '../types/user.types';

/** Forma del contenido (payload) que viaja dentro del token JWT. */
export interface JwtPayload {
  sub: string;
  username: string;
}

/** Firma un nuevo token JWT para el usuario autenticado. */
export function signAccessToken(user: PublicUser): string {
  const payload: JwtPayload = { sub: user.id, username: user.username };
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Verifica un token JWT y devuelve su contenido decodificado.
 * Lanza un error (capturado por el middleware de autenticacion) si el token
 * es invalido, fue alterado o ya expiro.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
