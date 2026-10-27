import { db } from '../config/database';

/** Repositorio de la tabla `app_meta`: valores internos del servidor (clave -> valor). */

export function getMetaValue(key: string): string | undefined {
  const row = db.prepare<[string], { value: string }>('SELECT value FROM app_meta WHERE key = ?').get(key);
  return row?.value;
}

export function setMetaValue(key: string, value: string): void {
  db.prepare(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, value);
}
