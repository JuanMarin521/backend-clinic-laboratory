import { LOGIN_LOCKOUT_MINUTES, MAX_FAILED_LOGIN_ATTEMPTS } from '../config/constants';
import { TooManyRequestsError } from '../exceptions';
import { deleteLoginAttempt, findLoginAttempt, saveLoginAttempt } from '../repositories/loginAttemptRepository';

/**
 * Bloqueo temporal por intentos fallidos (proteccion contra adivinar contrasenas).
 * Despues de MAX_FAILED_LOGIN_ATTEMPTS contrasenas incorrectas seguidas para un mismo
 * usuario, el ingreso con contrasena de ese usuario queda bloqueado LOGIN_LOCKOUT_MINUTES.
 * Mientras dure el bloqueo ni siquiera se revisa la contrasena (aunque sea la correcta).
 *
 * Se aplica igual exista o no el usuario, para no revelar que nombres de usuario existen.
 */

function lockedMessage(lockedUntil: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 60_000));
  return `Demasiados intentos fallidos. Por seguridad, el ingreso se bloqueo por ${minutes} minuto${minutes === 1 ? '' : 's'}.`;
}

/** Lanza 429 si el usuario esta bloqueado en este momento. */
export function assertLoginAllowed(username: string, now = new Date()): void {
  const attempt = findLoginAttempt(username);
  if (attempt?.lockedUntil && new Date(attempt.lockedUntil) > now) {
    throw new TooManyRequestsError(lockedMessage(new Date(attempt.lockedUntil), now));
  }
}

/**
 * Registra una contrasena incorrecta. Si con este intento se llega al limite,
 * bloquea al usuario y lanza 429; si no, solo suma el intento.
 */
export function registerFailedLogin(username: string, now = new Date()): void {
  const previous = findLoginAttempt(username);
  // `assertLoginAllowed` ya descarto un bloqueo vigente; si habia uno, ya vencio y se cuenta desde cero.
  const hadExpiredLock = Boolean(previous?.lockedUntil);
  const failedCount = (previous && !hadExpiredLock ? previous.failedCount : 0) + 1;

  if (failedCount >= MAX_FAILED_LOGIN_ATTEMPTS) {
    const lockedUntil = new Date(now.getTime() + LOGIN_LOCKOUT_MINUTES * 60_000);
    saveLoginAttempt({ username, failedCount, lastFailedAt: now.toISOString(), lockedUntil: lockedUntil.toISOString() });
    throw new TooManyRequestsError(lockedMessage(lockedUntil, now));
  }

  saveLoginAttempt({ username, failedCount, lastFailedAt: now.toISOString(), lockedUntil: null });
}

/** Borra los intentos fallidos despues de un ingreso correcto. */
export function clearFailedLogins(username: string): void {
  deleteLoginAttempt(username);
}
