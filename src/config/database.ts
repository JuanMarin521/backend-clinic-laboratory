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
 * Migracion de seguridad para bases de datos creadas ANTES de que los examenes
 * tuvieran dueño (`user_id`). Si la tabla `exams` ya existe pero le falta esa columna,
 * no hay forma de saber a que paciente pertenecia cada fila antigua, asi que se
 * recrea vacia (se vuelve a poblar sola en el siguiente arranque, ver `seedDemoExams`).
 * No afecta a `users` ni a `chat_messages`, que no cambiaron de forma.
 */
function migrateLegacyExamsTable(): void {
  const tableExists = db
    .prepare<[], { name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'exams'")
    .get();
  if (!tableExists) return;

  const columns = db.prepare<[], TableColumnInfo>('PRAGMA table_info(exams)').all();
  const hasUserId = columns.some((column) => column.name === 'user_id');

  if (!hasUserId) {
    db.exec('DROP TABLE exams');
  }
}

/**
 * Crea las tablas de la base de datos si todavia no existen.
 * Se llama una sola vez al arrancar el servidor (ver `server.ts`).
 */
export function runMigrations(): void {
  migrateLegacyExamsTable();
  db.exec(SCHEMA_SQL);
}
