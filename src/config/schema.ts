/**
 * Definicion del esquema SQL de la base de datos (DDL).
 * Se guarda como una constante de TypeScript (en lugar de un archivo .sql aparte)
 * para no depender de rutas de archivos al compilar el proyecto a `dist/`.
 *
 * Usa "CREATE TABLE IF NOT EXISTS" a proposito: ejecutar este esquema varias veces
 * (cada vez que arranca el servidor) es seguro y no borra datos existentes.
 */
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    full_name     TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exams (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    taken_date TEXT NOT NULL,
    site       TEXT NOT NULL,
    status     TEXT NOT NULL CHECK (status IN ('ready', 'processing', 'issue'))
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender     TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
    text       TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
`;
