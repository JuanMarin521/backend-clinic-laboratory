import { db } from '../config/database';
import type { ExamRecord, ExamStatus } from '../types/exam.types';

/**
 * Repositorio de examenes, respaldado por una base de datos SQLite real (tabla `exams`).
 * Cada examen pertenece a un unico paciente (`user_id`): un usuario nunca puede ver
 * ni descargar el examen de otro, porque todas las consultas filtran por `user_id`.
 */

/** Forma cruda de una fila de la tabla `exams`. */
interface ExamRow {
  id: string;
  user_id: string;
  name: string;
  taken_date: string;
  site: string;
  status: string;
}

/** Convierte una fila de la base de datos al tipo `ExamRecord` que usa el resto del codigo. */
function toExamRecord(row: ExamRow): ExamRecord {
  return {
    id: row.id,
    name: row.name,
    takenDate: row.taken_date,
    site: row.site,
    // La columna `status` tiene un CHECK en el esquema SQL que solo permite estos 3 valores.
    status: row.status as ExamStatus,
  };
}

/** Devuelve los examenes de un paciente especifico (ordenados del mas reciente al mas viejo). */
export function findExamsByUserId(userId: string): ExamRecord[] {
  const rows = db
    .prepare<[string], ExamRow>('SELECT * FROM exams WHERE user_id = ? ORDER BY taken_date DESC, name ASC')
    .all(userId);

  return rows.map(toExamRecord);
}

/**
 * Busca un examen por id, PERO solo si pertenece al paciente indicado.
 * Si el examen existe pero es de otro usuario, devuelve `undefined` (igual que si no
 * existiera): así no se revela a un paciente que el examen de otra persona existe.
 */
export function findExamByIdForUser(examId: string, userId: string): ExamRecord | undefined {
  const row = db
    .prepare<[string, string], ExamRow>('SELECT * FROM exams WHERE id = ? AND user_id = ?')
    .get(examId, userId);

  return row ? toExamRecord(row) : undefined;
}

/** Cuenta cuantos examenes tiene ya guardados un paciente (para no duplicar al sembrar datos). */
function countExamsForUser(userId: string): number {
  const row = db
    .prepare<[string], { count: number }>('SELECT COUNT(*) AS count FROM exams WHERE user_id = ?')
    .get(userId);

  return row?.count ?? 0;
}

/** Inserta un lote de examenes para un paciente dentro de una unica transaccion. */
function insertExamsForUser(userId: string, exams: Omit<ExamRecord, 'id'>[]): void {
  const insert = db.prepare(
    'INSERT INTO exams (id, user_id, name, taken_date, site, status) VALUES (@id, @userId, @name, @takenDate, @site, @status)',
  );

  const insertAll = db.transaction((rows: ExamRecord[]) => {
    rows.forEach((exam) => insert.run({ ...exam, userId }));
  });

  const rowsWithId: ExamRecord[] = exams.map((exam, index) => ({
    ...exam,
    id: `exam_${userId}_${Date.now()}_${index}`,
  }));

  insertAll(rowsWithId);
}

/**
 * Siembra el conjunto de examenes de demostracion para el usuario demo
 * ("carlos.mendoza385"). Es seguro llamarla en cada arranque: si ese paciente
 * ya tiene examenes guardados, no hace nada.
 */
export function seedDemoExamsForUser(userId: string): void {
  if (countExamsForUser(userId) > 0) return;

  insertExamsForUser(userId, [
    { name: 'Hemograma completo', takenDate: '19 sep', site: 'Loureles', status: 'ready' },
    { name: 'Perfil lipídico', takenDate: '19 sep', site: 'Loureles', status: 'ready' },
    { name: 'Glisemia basal', takenDate: '19 sep', site: 'Loureles', status: 'issue' },
    { name: 'Perfil Metabólico', takenDate: '13 sep', site: 'Loureles', status: 'processing' },
  ]);
}

/**
 * Siembra un par de examenes iniciales para un paciente recien registrado,
 * para que la pantalla de Resultados no se vea vacia justo despues de crear la cuenta.
 * Se llama una sola vez, desde `authService.registerUser`.
 */
export function seedStarterExamsForUser(userId: string): void {
  insertExamsForUser(userId, [
    { name: 'Hemograma completo', takenDate: 'Hoy', site: 'Loureles', status: 'processing' },
    { name: 'Perfil lipídico', takenDate: 'Hoy', site: 'Loureles', status: 'processing' },
  ]);
}
