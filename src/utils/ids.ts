/**
 * Generador simple de identificadores unicos para los registros en memoria.
 * En una base de datos real este rol lo cumpliria el motor (UUID, autoincremental, etc.).
 */
let counter = 0;

export function generateId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}`;
}
