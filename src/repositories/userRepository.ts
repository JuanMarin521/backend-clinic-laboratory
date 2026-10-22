import { db } from '../config/database';
import type { UserRecord } from '../types/user.types';

/**
 * Repositorio de usuarios, respaldado por una base de datos SQLite real (tabla `users`).
 * El resto de la aplicacion (services, controllers, middlewares) sigue llamando
 * estas mismas funciones sin saber que por dentro ahora hay SQL en lugar de un arreglo
 * en memoria: ese es el punto de tener una capa de repositorio separada.
 */

/** Forma cruda de una fila de la tabla `users` (columnas en snake_case, como en SQL). */
interface UserRow {
  id: string;
  full_name: string;
  username: string;
  password_hash: string;
  created_at: string;
}

/** Convierte una fila de la base de datos al tipo `UserRecord` que usa el resto del codigo. */
function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

/** Normaliza el nombre de usuario (minusculas, sin espacios) para comparaciones consistentes. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Busca un usuario por su nombre de usuario. Devuelve `undefined` si no existe. */
export function findUserByUsername(username: string): UserRecord | undefined {
  const row = db
    .prepare<[string], UserRow>('SELECT * FROM users WHERE username = ?')
    .get(normalizeUsername(username));

  return row ? toUserRecord(row) : undefined;
}

/** Busca un usuario por su identificador. Devuelve `undefined` si no existe. */
export function findUserById(id: string): UserRecord | undefined {
  const row = db.prepare<[string], UserRow>('SELECT * FROM users WHERE id = ?').get(id);
  return row ? toUserRecord(row) : undefined;
}

/** Crea y guarda un nuevo usuario en la base de datos. */
export function createUser(data: { fullName: string; username: string; passwordHash: string }): UserRecord {
  const newUser: UserRecord = {
    id: `user_${Date.now()}_${Math.round(Math.random() * 1_000_000)}`,
    fullName: data.fullName.trim(),
    username: normalizeUsername(data.username),
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    'INSERT INTO users (id, full_name, username, password_hash, created_at) VALUES (@id, @fullName, @username, @passwordHash, @createdAt)',
  ).run(newUser);

  return newUser;
}

/**
 * Carga un usuario de demostracion para poder probar el login sin registrarse antes.
 * Coincide con el usuario "Carlos Mendoza" que usan las pantallas de la app movil.
 * La contrasena de prueba es "lab2026". Es seguro llamarla en cada arranque del servidor:
 * si el usuario ya existe en la base de datos, no lo vuelve a crear.
 * Devuelve el usuario (ya existente o recien creado) para que quien la llama
 * pueda, por ejemplo, sembrarle examenes de demostracion.
 */
export function seedDemoUser(passwordHash: string): UserRecord {
  const existingUser = findUserByUsername('carlos.mendoza385');
  if (existingUser) return existingUser;

  return createUser({ fullName: 'Carlos Mendoza', username: 'carlos.mendoza385', passwordHash });
}
