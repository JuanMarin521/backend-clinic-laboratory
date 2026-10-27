import { db } from '../config/database';
import type { UpdateProfileInput, UserRecord } from '../types/user.types';

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
  document_number: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  birth_date: string | null;
}

/** Convierte una fila de la base de datos al tipo `UserRecord` que usa el resto del codigo. */
function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    username: row.username,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    documentNumber: row.document_number,
    email: row.email,
    phone: row.phone,
    address: row.address,
    birthDate: row.birth_date,
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
    documentNumber: null,
    email: null,
    phone: null,
    address: null,
    birthDate: null,
  };

  db.prepare(
    'INSERT INTO users (id, full_name, username, password_hash, created_at) VALUES (@id, @fullName, @username, @passwordHash, @createdAt)',
  ).run({
    id: newUser.id,
    fullName: newUser.fullName,
    username: newUser.username,
    passwordHash: newUser.passwordHash,
    createdAt: newUser.createdAt,
  });

  return newUser;
}

/** Actualiza el nombre y los datos de perfil de un usuario. Devuelve el usuario ya actualizado. */
export function updateUserProfile(id: string, data: UpdateProfileInput): UserRecord | undefined {
  db.prepare(
    `UPDATE users
     SET full_name = @fullName, document_number = @documentNumber, email = @email,
         phone = @phone, address = @address, birth_date = @birthDate
     WHERE id = @id`,
  ).run({ ...data, id });

  return findUserById(id);
}

/** Reemplaza el hash de la contrasena de un usuario. */
export function updateUserPassword(id: string, passwordHash: string): void {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
}
