import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { env } from './env';
import { SCHEMA_SQL } from './schema';

/**
 * Conexion unica (singleton) a la base de datos SQLite.
 * Todo el resto de la aplicacion (solo las `repositories/`) importa esta
 * instancia ya lista para usar, en vez de abrir conexiones por su cuenta.
 *
 * SQLite guarda todo en un UNICO archivo (`data/cpo-conecta.db`), por lo que
 * a diferencia del almacenamiento en memoria de versiones anteriores, los datos
 * ahora SI persisten entre reinicios del servidor.
 */
const databaseFilePath = resolve(process.cwd(), env.databasePath);

// Crea la carpeta del archivo de base de datos si todavia no existe (ej. "data/").
mkdirSync(dirname(databaseFilePath), { recursive: true });

export const db = new Database(databaseFilePath);

// Activa las llaves foraneas (SQLite las trae desactivadas por defecto).
db.pragma('foreign_keys = ON');
// "WAL" mejora el rendimiento con lecturas/escrituras concurrentes.
db.pragma('journal_mode = WAL');

/**
 * Crea las tablas de la base de datos si todavia no existen.
 * Se llama una sola vez al arrancar el servidor (ver `server.ts`).
 */
export function runMigrations(): void {
  db.exec(SCHEMA_SQL);
}
