import bcrypt from 'bcryptjs';

import { env } from '../config/env';

/** Genera el hash de una contrasena en texto plano para guardarlo en la base de datos. */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.bcryptSaltRounds);
}

/** Compara una contrasena en texto plano contra su hash almacenado. */
export async function comparePassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
