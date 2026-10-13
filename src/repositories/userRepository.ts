import { generateId } from '../utils/ids';
import type { UserRecord } from '../types/user.types';

/**
 * "Base de datos" en memoria de usuarios.
 * En este MVP no hay persistencia real: los datos viven mientras el proceso este corriendo.
 * Cambiar esta implementacion por una real (Postgres, Mongo, etc.) no afectaria
 * al resto de las capas, ya que ellas solo conocen estas funciones, no como se guardan los datos.
 */
const users: UserRecord[] = [];

/** Normaliza el nombre de usuario (minusculas, sin espacios) para comparaciones consistentes. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Busca un usuario por su nombre de usuario. Devuelve `undefined` si no existe. */
export function findUserByUsername(username: string): UserRecord | undefined {
  const normalized = normalizeUsername(username);
  return users.find((user) => user.username === normalized);
}

/** Busca un usuario por su identificador. Devuelve `undefined` si no existe. */
export function findUserById(id: string): UserRecord | undefined {
  return users.find((user) => user.id === id);
}

/** Crea y guarda un nuevo usuario en el repositorio. */
export function createUser(data: { fullName: string; username: string; passwordHash: string }): UserRecord {
  const newUser: UserRecord = {
    id: generateId('user'),
    fullName: data.fullName.trim(),
    username: normalizeUsername(data.username),
    passwordHash: data.passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  return newUser;
}

/**
 * Carga un usuario de demostracion para poder probar el login sin registrarse antes.
 * Coincide con el usuario "Carlos Mendoza" que usan las pantallas de la app movil.
 * La contrasena de prueba es "lab2026".
 */
export function seedDemoUser(passwordHash: string): void {
  if (findUserByUsername('carlos.mendoza385')) return;

  users.push({
    id: generateId('user'),
    fullName: 'Carlos Mendoza',
    username: 'carlos.mendoza385',
    passwordHash,
    createdAt: new Date().toISOString(),
  });
}
