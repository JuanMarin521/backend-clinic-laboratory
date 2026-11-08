import { ConflictError, UnauthorizedError } from '../exceptions';
import { createOrderWithExams } from '../repositories/orderRepository';
import { buildStarterOrder } from '../seed/orderGenerator';
import {
  createUser,
  findUserByDocumentNumber,
  findUserByUsername,
  normalizeUsername,
} from '../repositories/userRepository';
import { comparePassword, hashPassword } from '../utils/password';
import { assertLoginAllowed, clearFailedLogins, registerFailedLogin } from './loginThrottleService';
import { signAccessToken } from '../utils/jwt';
import type { LoginInput, PublicUser, RegisterInput, UserRecord } from '../types/user.types';

/** Mensaje cuando el documento ya pertenece a otra cuenta (registro y Perfil). */
export const DUPLICATED_DOCUMENT_MESSAGE = 'Ya existe una cuenta con ese numero de documento.';

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
 * Registra un nuevo paciente con sus datos personales.
 * Lanza `ConflictError` (409) si el nombre de usuario o el documento ya estan en uso.
 */
export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const existingUser = findUserByUsername(input.username);

  if (existingUser) {
    throw new ConflictError('El nombre de usuario ya esta registrado.');
  }

  // Un documento de identidad corresponde a una sola persona: no se permiten dos cuentas con el mismo.
  if (findUserByDocumentNumber(input.documentNumber)) {
    throw new ConflictError(DUPLICATED_DOCUMENT_MESSAGE);
  }

  const passwordHash = await hashPassword(input.password);
  const newUser = createUser({
    fullName: input.fullName,
    username: input.username,
    passwordHash,
    profile: {
      documentNumber: input.documentNumber,
      birthDate: input.birthDate,
      phone: input.phone,
      email: input.email,
      address: input.address,
    },
  });

  // Todo paciente nuevo arranca con una orden de ejemplo (fecha de hoy, 8 examenes en proceso),
  // para que la pantalla de Resultados no se vea vacia al registrarse.
  createOrderWithExams(newUser.id, buildStarterOrder());

  const publicUser = toPublicUser(newUser);
  return { user: publicUser, token: signAccessToken(publicUser) };
}

/** Mensaje unico para usuario inexistente o contrasena incorrecta (no da pistas). */
const INVALID_CREDENTIALS_MESSAGE = 'Usuario o contrasena incorrectos.';

/**
 * Hash de una contrasena cualquiera. Se compara contra el cuando el usuario NO existe,
 * para que la respuesta tarde lo mismo que con un usuario real (si respondiera mas rapido,
 * alguien podria descubrir que nombres de usuario existen midiendo el tiempo).
 */
let dummyPasswordHash: Promise<string> | null = null;
function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= hashPassword('cpo-conecta-dummy-password');
  return dummyPasswordHash;
}

/**
 * Verifica usuario y contrasena aplicando el bloqueo por intentos fallidos.
 * - 429 si el usuario esta bloqueado (o si este intento completa el limite).
 * - 401 con un mensaje generico si el usuario no existe o la contrasena no coincide.
 * Devuelve el usuario si las credenciales son correctas (y reinicia el contador de intentos).
 */
export async function verifyCredentials(username: string, password: string): Promise<UserRecord> {
  const key = normalizeUsername(username);
  assertLoginAllowed(key);

  const user = findUserByUsername(key);
  let isPasswordValid = false;
  if (user) {
    isPasswordValid = await comparePassword(password, user.passwordHash);
  } else {
    await comparePassword(password, await getDummyPasswordHash());
  }

  if (!user || !isPasswordValid) {
    registerFailedLogin(key);
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  clearFailedLogins(key);
  return user;
}

/** Inicia sesion con usuario y contrasena (ver `verifyCredentials`). */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const user = await verifyCredentials(input.username, input.password);
  const publicUser = toPublicUser(user);
  return { user: publicUser, token: signAccessToken(publicUser) };
}

// Se re-exporta para que otras capas (ej. authMiddleware) puedan normalizar nombres de usuario
// sin tener que importar directamente desde el repositorio.
export { normalizeUsername };
