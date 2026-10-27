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

/** Forma de una fila que devuelve `PRAGMA table_info(<tabla>)`. */
interface TableColumnInfo {
  name: string;
}

/**
 * Migracion de seguridad para bases de datos creadas con versiones anteriores del esquema,
 * en las que la tabla `exams` no tenia `order_id` (los examenes no estaban agrupados en ordenes).
 * No hay forma confiable de reconstruir las ordenes a partir de esas filas antiguas
 * (la fecha se guardaba como texto libre, ej. "19 sep" u "Hoy"), asi que la tabla se
 * recrea vacia; el usuario demo se vuelve a poblar solo en el arranque (ver `seedDemoOrdersForUser`).
 * No afecta a `users` ni a `chat_messages`, que no cambiaron de forma.
 */
function migrateLegacyExamsTable(): void {
  const tableExists = db
    .prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'exams'")
    .get();
  if (!tableExists) return;

  const columns = db.prepare<[], TableColumnInfo>('PRAGMA table_info(exams)').all();
  const hasOrderId = columns.some((column) => column.name === 'order_id');

  if (!hasOrderId) {
    db.exec('DROP TABLE exams');
  }
}

/** Columnas del perfil del paciente que se agregaron a `users` despues de la primera version. */
const USER_PROFILE_COLUMNS = ['document_number', 'email', 'phone', 'address', 'birth_date'];

/**
 * Migracion para bases de datos creadas antes de que existiera el perfil del paciente:
 * agrega a `users` las columnas que le falten. A diferencia de `migrateLegacyExamsTable`,
 * aqui NO se borra nada: los usuarios existentes se conservan con esos campos vacios.
 */
function addUserProfileColumns(): void {
  const columns = db.prepare<[], TableColumnInfo>('PRAGMA table_info(users)').all();
  const existing = new Set(columns.map((column) => column.name));

  USER_PROFILE_COLUMNS.filter((name) => !existing.has(name)).forEach((name) => {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} TEXT`);
  });
}

/**
 * Crea las tablas de la base de datos si todavia no existen.
 * Se llama una sola vez al arrancar el servidor (ver `server.ts`).
 */
export function runMigrations(): void {
  migrateLegacyExamsTable();
  db.exec(SCHEMA_SQL);
  addUserProfileColumns();
}
