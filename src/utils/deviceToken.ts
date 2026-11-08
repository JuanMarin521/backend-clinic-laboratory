import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

/**
 * Utilidades criptograficas de los tokens biometricos de dispositivo.
 *
 * Formato del token: "<id>.<secreto>"
 * - id: identificador publico de la credencial (para buscarla sin recorrer la tabla).
 * - secreto: 32 bytes aleatorios (256 bits) en base64url. Solo lo conoce el celular.
 *
 * En la base de datos solo se guarda el SHA-256 del secreto. Como el secreto es aleatorio
 * y largo (no una contrasena elegida por una persona), SHA-256 es suficiente: no se puede
 * adivinar por fuerza bruta. Si alguien roba la base de datos, no obtiene tokens usables.
 */

const SECRET_BYTES = 32;
const TOKEN_PATTERN = /^(dc_[0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/;

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/** Genera un token nuevo y devuelve sus partes (el hash es lo unico que se guarda). */
export function generateDeviceToken(): { credentialId: string; token: string; secretHash: string } {
  const credentialId = `dc_${randomUUID()}`;
  const secret = randomBytes(SECRET_BYTES).toString('base64url');
  return { credentialId, token: `${credentialId}.${secret}`, secretHash: hashSecret(secret) };
}

/** Separa un token en id y secreto. Devuelve `null` si no tiene el formato esperado. */
export function parseDeviceToken(token: string): { credentialId: string; secret: string } | null {
  const match = TOKEN_PATTERN.exec(token);
  return match ? { credentialId: match[1], secret: match[2] } : null;
}

/**
 * Compara el secreto recibido con el hash guardado en tiempo constante
 * (evita ataques que miden cuanto tarda la comparacion para adivinar el valor).
 */
export function secretMatchesHash(secret: string, storedHash: string): boolean {
  const received = Buffer.from(hashSecret(secret), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return received.length === stored.length && timingSafeEqual(received, stored);
}

/** Expresion regular del token, compartida con el validador de las rutas. */
export const DEVICE_TOKEN_PATTERN = TOKEN_PATTERN;
