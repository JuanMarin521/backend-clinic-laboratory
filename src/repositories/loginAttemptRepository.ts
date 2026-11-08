import { db } from '../config/database';

/** Repositorio de intentos fallidos de inicio de sesion (tabla `login_attempts`). */

export interface LoginAttemptRecord {
  username: string;
  failedCount: number;
  lastFailedAt: string;
  lockedUntil: string | null;
}

interface LoginAttemptRow {
  username: string;
  failed_count: number;
  last_failed_at: string;
  locked_until: string | null;
}

export function findLoginAttempt(username: string): LoginAttemptRecord | undefined {
  const row = db.prepare<[string], LoginAttemptRow>('SELECT * FROM login_attempts WHERE username = ?').get(username);
  return row
    ? { username: row.username, failedCount: row.failed_count, lastFailedAt: row.last_failed_at, lockedUntil: row.locked_until }
    : undefined;
}

export function saveLoginAttempt(attempt: LoginAttemptRecord): void {
  db.prepare(
    `INSERT INTO login_attempts (username, failed_count, last_failed_at, locked_until)
     VALUES (@username, @failedCount, @lastFailedAt, @lockedUntil)
     ON CONFLICT(username) DO UPDATE SET
       failed_count = excluded.failed_count,
       last_failed_at = excluded.last_failed_at,
       locked_until = excluded.locked_until`,
  ).run(attempt);
}

export function deleteLoginAttempt(username: string): void {
  db.prepare('DELETE FROM login_attempts WHERE username = ?').run(username);
}
