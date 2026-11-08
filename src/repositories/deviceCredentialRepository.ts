import { db } from '../config/database';
import type { DeviceCredentialRecord, DeviceCredentialRevokeReason } from '../types/deviceCredential.types';

/** Repositorio de credenciales biometricas de dispositivo (tabla `device_credentials`). */

interface DeviceCredentialRow {
  id: string;
  user_id: string;
  secret_hash: string;
  device_name: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
}

function toRecord(row: DeviceCredentialRow): DeviceCredentialRecord {
  return {
    id: row.id,
    userId: row.user_id,
    secretHash: row.secret_hash,
    deviceName: row.device_name,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason as DeviceCredentialRevokeReason | null,
  };
}

export function findDeviceCredentialById(id: string): DeviceCredentialRecord | undefined {
  const row = db.prepare<[string], DeviceCredentialRow>('SELECT * FROM device_credentials WHERE id = ?').get(id);
  return row ? toRecord(row) : undefined;
}

export function insertDeviceCredential(
  credential: Omit<DeviceCredentialRecord, 'revokedAt' | 'revokedReason'>,
): void {
  db.prepare(
    `INSERT INTO device_credentials (id, user_id, secret_hash, device_name, created_at, expires_at)
     VALUES (@id, @userId, @secretHash, @deviceName, @createdAt, @expiresAt)`,
  ).run(credential);
}

/** Revoca una credencial (si todavia estaba activa). */
export function revokeDeviceCredential(id: string, reason: DeviceCredentialRevokeReason, revokedAt: string): void {
  db.prepare(
    'UPDATE device_credentials SET revoked_at = ?, revoked_reason = ? WHERE id = ? AND revoked_at IS NULL',
  ).run(revokedAt, reason, id);
}

/** Revoca TODAS las credenciales activas de un paciente (ej. al cambiar la contrasena). */
export function revokeAllDeviceCredentialsForUser(
  userId: string,
  reason: DeviceCredentialRevokeReason,
  revokedAt: string,
): void {
  db.prepare(
    'UPDATE device_credentials SET revoked_at = ?, revoked_reason = ? WHERE user_id = ? AND revoked_at IS NULL',
  ).run(revokedAt, reason, userId);
}
