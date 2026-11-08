/** Motivo por el que una credencial biometrica dejo de ser valida. */
export type DeviceCredentialRevokeReason =
  | 'rotated'
  | 'disabled'
  | 'logout'
  | 'password_change'
  | 'reuse_detected';

/** Credencial biometrica de un dispositivo, tal como se guarda (solo el hash del secreto). */
export interface DeviceCredentialRecord {
  id: string;
  userId: string;
  secretHash: string;
  deviceName: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revokedReason: DeviceCredentialRevokeReason | null;
}

/** Lo que recibe la app al activar o usar el ingreso biometrico. */
export interface IssuedDeviceToken {
  /** Token completo "<id>.<secreto>". La app lo guarda cifrado; el servidor no lo vuelve a ver en claro. */
  deviceToken: string;
  /** Fecha (ISO) en que vence si no se vuelve a usar. */
  expiresAt: string;
}
