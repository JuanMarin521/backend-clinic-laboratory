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
    created_at    TEXT NOT NULL,
    -- Datos del perfil del paciente (opcionales: el paciente los completa desde la app).
    document_number TEXT,
    email           TEXT,
    phone           TEXT,
    address         TEXT,
    birth_date      TEXT -- formato ISO "YYYY-MM-DD"
  );

  -- Una orden agrupa los examenes que un paciente se tomo en una misma visita al laboratorio.
  -- order_number: numero de orden de 6 digitos (ej. "546237"), unico en todo el sistema.
  -- order_date: fecha de la visita en formato ISO "YYYY-MM-DD" (asi se puede ordenar como texto).
  -- UNIQUE (user_id, order_date): un paciente solo puede tener UNA orden por dia.
  CREATE TABLE IF NOT EXISTS orders (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE CHECK (length(order_number) = 6),
    order_date   TEXT NOT NULL,
    site         TEXT NOT NULL,
    UNIQUE (user_id, order_date)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

  -- Cada examen pertenece a una orden (y a traves de ella, a un unico paciente).
  -- La fecha y la sede ya no se guardan aqui: son las de su orden.
  CREATE TABLE IF NOT EXISTS exams (
    id       TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    name     TEXT NOT NULL,
    status   TEXT NOT NULL CHECK (status IN ('ready', 'processing', 'issue'))
  );

  CREATE INDEX IF NOT EXISTS idx_exams_order_id ON exams(order_id);

  -- Pares clave/valor internos del servidor (ej. que version de los datos de prueba esta cargada).
  CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
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
