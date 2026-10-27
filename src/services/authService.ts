import { ConflictError, UnauthorizedError } from '../exceptions';
import { createOrderWithExams } from '../repositories/orderRepository';
import { buildStarterOrder } from '../seed/orderGenerator';
import {
  createUser,
  findUserByUsername,
  normalizeUsername,
} from '../repositories/userRepository';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import type { LoginInput, PublicUser, RegisterInput, UserRecord } from '../types/user.types';

/** Convierte un registro interno de usuario (con hash de contrasena) en su version publica y segura. */
export function toPublicUser(user: UserRecord): PublicUser {
  return { id: user.id, fullName: user.fullName, username: user.username };
}

/** Forma de la respuesta que devuelven login y register al cliente. */
export interface AuthResult {
  user: PublicUser;
  token: string;
}

/**
 * Registra un nuevo usuario.
 * Lanza `ConflictError` (409) si el nombre de usuario ya esta en uso.
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = findUserByUsername(input.username);

  if (existingUser) {
    throw new ConflictError('El nombre de usuario ya esta registrado.');
  }

  const passwordHash = await hashPassword(input.password);
  const newUser = createUser({ fullName: input.fullName, username: input.username, passwordHash });

  // Todo paciente nuevo arranca con una orden de ejemplo (fecha de hoy, 8 examenes en proceso),
  // para que la pantalla de Resultados no se vea vacia al registrarse.
  createOrderWithExams(newUser.id, buildStarterOrder());

  const publicUser = toPublicUser(newUser);
  return { user: publicUser, token: signAccessToken(publicUser) };
}

/**
 * Valida las credenciales de un usuario e inicia sesion.
 * Lanza `UnauthorizedError` (401) con un mensaje generico si el usuario no existe
 * o la contrasena no coincide (a proposito no se distingue cual de las dos fallo,
 * para no darle pistas a quien intenta adivinar credenciales).
 */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = findUserByUsername(input.username);

  if (!user) {
    throw new UnauthorizedError('Usuario o contrasena incorrectos.');
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Usuario o contrasena incorrectos.');
  }

  const publicUser = toPublicUser(user);
  return { user: publicUser, token: signAccessToken(publicUser) };
}

// Se re-exporta para que otras capas (ej. authMiddleware) puedan normalizar nombres de usuario
// sin tener que importar directamente desde el repositorio.
export { normalizeUsername };
