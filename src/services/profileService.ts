import { NotFoundError, ValidationError } from '../exceptions';
import { findUserById, updateUserPassword, updateUserProfile } from '../repositories/userRepository';
import type { UpdateProfileInput, UserProfile, UserRecord } from '../types/user.types';
import { comparePassword, hashPassword } from '../utils/password';

/** Convierte el registro interno en el perfil que ve la app (SIN el hash de la contrasena). */
function toUserProfile(user: UserRecord): UserProfile {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    documentNumber: user.documentNumber,
    email: user.email,
    phone: user.phone,
    address: user.address,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
  };
}

/** Busca al usuario o lanza 404 (por ejemplo, si se borro mientras su token seguia vigente). */
function getUserOrThrow(userId: string): UserRecord {
  const user = findUserById(userId);
  if (!user) throw new NotFoundError('No se encontro el perfil del paciente.');
  return user;
}

/** Perfil completo del paciente autenticado. */
export function getProfile(userId: string): UserProfile {
  return toUserProfile(getUserOrThrow(userId));
}

/** Actualiza el nombre y los datos de contacto del paciente. Devuelve el perfil actualizado. */
export function updateProfile(userId: string, input: UpdateProfileInput): UserProfile {
  getUserOrThrow(userId);
  const updated = updateUserProfile(userId, input);
  return toUserProfile(updated ?? getUserOrThrow(userId));
}

/**
 * Cambia la contrasena. Exige la contrasena actual y que la nueva sea distinta (400 en ambos casos).
 * Se usa 400 y no 401 a proposito: un 401 significa "tu sesion no es valida", y aqui la
 * sesion SI es valida; solo se escribio mal la contrasena actual en el formulario.
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = getUserOrThrow(userId);

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) throw new ValidationError('La contrasena actual no es correcta.');

  if (currentPassword === newPassword) {
    throw new ValidationError('La nueva contrasena debe ser distinta a la actual.');
  }

  updateUserPassword(userId, await hashPassword(newPassword));
}
