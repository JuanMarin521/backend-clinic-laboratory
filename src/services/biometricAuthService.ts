import { db } from '../config/database';
import { DEVICE_CREDENTIAL_TTL_DAYS } from '../config/constants';
import { UnauthorizedError } from '../exceptions';
import {
  findDeviceCredentialById,
  insertDeviceCredential,
  revokeAllDeviceCredentialsForUser,
  revokeDeviceCredential,
} from '../repositories/deviceCredentialRepository';
import { findUserById } from '../repositories/userRepository';
import type {
  DeviceCredentialRecord,
  DeviceCredentialRevokeReason,
  IssuedDeviceToken,
} from '../types/deviceCredential.types';
import { generateDeviceToken, parseDeviceToken, secretMatchesHash } from '../utils/deviceToken';
import { signAccessToken } from '../utils/jwt';
import { toPublicUser, verifyCredentials, type AuthResult } from './authService';

/**
 * Ingreso biometrico con "credencial de dispositivo".
 *
 * 1. Activar (enroll): el paciente ya inicio sesion y confirma su contrasena. El servidor
 *    crea un token aleatorio para ESE celular y guarda solo su hash.
 * 2. El celular guarda el token cifrado (Keystore / Keychain). La huella o el rostro son los
 *    que permiten leerlo; la contrasena nunca se guarda en el celular.
 * 3. Ingresar: el celular envia el token. Si es valido, el servidor responde con un JWT
 *    normal y un token NUEVO (rotacion); el anterior queda revocado.
 * 4. Si alguien vuelve a usar un token ya rotado, significa que fue copiado: se revocan
 *    TODAS las credenciales del paciente y tendra que volver a entrar con contrasena.
 *
 * Cada token vence a los DEVICE_CREDENTIAL_TTL_DAYS dias si no se usa.
 */

/** Mensaje unico para cualquier token invalido (no se dice por que fallo). */
const INVALID_DEVICE_TOKEN_MESSAGE = 'El ingreso biometrico ya no es valido. Ingresa con tu contrasena.';

/** Respuesta del ingreso biometrico: la sesion normal + el token nuevo del dispositivo. */
export type BiometricLoginResult = AuthResult & IssuedDeviceToken;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Crea y guarda una credencial nueva para un dispositivo. */
function issueDeviceToken(userId: string, deviceName: string, now: Date): IssuedDeviceToken {
  const { credentialId, token, secretHash } = generateDeviceToken();
  const expiresAt = addDays(now, DEVICE_CREDENTIAL_TTL_DAYS).toISOString();

  insertDeviceCredential({ id: credentialId, userId, secretHash, deviceName, createdAt: now.toISOString(), expiresAt });
  return { deviceToken: token, expiresAt };
}

/** Busca la credencial del token y comprueba el secreto. `undefined` si no corresponde. */
function findMatchingCredential(deviceToken: string): DeviceCredentialRecord | undefined {
  const parsed = parseDeviceToken(deviceToken);
  if (!parsed) return undefined;

  const credential = findDeviceCredentialById(parsed.credentialId);
  return credential && secretMatchesHash(parsed.secret, credential.secretHash) ? credential : undefined;
}

/**
 * Activa el ingreso biometrico en un dispositivo. Exige la contrasena otra vez, para que
 * alguien que tome un celular con la sesion abierta no pueda registrar su propia huella.
 */
export async function enrollDevice(userId: string, password: string, deviceName: string): Promise<IssuedDeviceToken> {
  const user = findUserById(userId);
  if (!user) throw new UnauthorizedError();

  await verifyCredentials(user.username, password);
  return issueDeviceToken(user.id, deviceName, new Date());
}

/** Inicia sesion con el token del dispositivo y lo rota (ver explicacion arriba). */
export function loginWithDeviceToken(deviceToken: string): BiometricLoginResult {
  const now = new Date();
  const credential = findMatchingCredential(deviceToken);
  if (!credential) throw new UnauthorizedError(INVALID_DEVICE_TOKEN_MESSAGE);

  if (credential.revokedAt) {
    // Un token ya rotado que vuelve a aparecer = copia robada: se cierra todo por seguridad.
    if (credential.revokedReason === 'rotated') {
      revokeAllDeviceCredentialsForUser(credential.userId, 'reuse_detected', now.toISOString());
    }
    throw new UnauthorizedError(INVALID_DEVICE_TOKEN_MESSAGE);
  }

  const user = findUserById(credential.userId);
  if (!user || new Date(credential.expiresAt) <= now) {
    throw new UnauthorizedError(INVALID_DEVICE_TOKEN_MESSAGE);
  }

  const issued = db.transaction(() => {
    revokeDeviceCredential(credential.id, 'rotated', now.toISOString());
    return issueDeviceToken(user.id, credential.deviceName, now);
  })();

  const publicUser = toPublicUser(user);
  return { user: publicUser, token: signAccessToken(publicUser), ...issued };
}

/**
 * Desactiva el ingreso biometrico de UN dispositivo (al desactivarlo en el Perfil,
 * al cerrar sesion o con "No soy yo"). Solo funciona con el token completo, asi nadie
 * puede revocar credenciales ajenas. Nunca falla hacia afuera: si el token no sirve, no hace nada.
 */
export function revokeDeviceToken(deviceToken: string, reason: Extract<DeviceCredentialRevokeReason, 'disabled' | 'logout'>): void {
  const credential = findMatchingCredential(deviceToken);
  if (credential) revokeDeviceCredential(credential.id, reason, new Date().toISOString());
}

/** Desactiva el ingreso biometrico en TODOS los dispositivos del paciente. */
export function revokeAllDevicesForUser(userId: string, reason: DeviceCredentialRevokeReason): void {
  revokeAllDeviceCredentialsForUser(userId, reason, new Date().toISOString());
}
