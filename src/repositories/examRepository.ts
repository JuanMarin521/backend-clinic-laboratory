import { db } from '../config/database';
import type { ExamRecord, ExamStatus } from '../types/exam.types';

/**
 * Repositorio de examenes, respaldado por una base de datos SQLite real (tabla `exams`).
 * En este MVP todos los usuarios autenticados ven el mismo conjunto de examenes de
 * demostracion (en un sistema real cada examen estaria asociado a un `patientId`).
 */

/** Forma cruda de una fila de la tabla `exams`. */
interface ExamRow {
  id: string;
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

/** Devuelve la lista completa de examenes disponibles. */
export function findAllExams(): ExamRecord[] {
  const rows = db.prepare<[], ExamRow>('SELECT * FROM exams ORDER BY taken_date DESC, name ASC').all();
  return rows.map(toExamRecord);
}

/** Busca un examen por su identificador. Devuelve `undefined` si no existe. */
export function findExamById(examId: string): ExamRecord | undefined {
  const row = db.prepare<[string], ExamRow>('SELECT * FROM exams WHERE id = ?').get(examId);
  return row ? toExamRecord(row) : undefined;
}

/** Exámenes de demostración (mismos datos que usaban las pantallas antes de tener backend). */
const DEMO_EXAMS: ExamRecord[] = [
  { id: '1', name: 'Hemograma completo', takenDate: '19 sep', site: 'Loureles', status: 'ready' },
  { id: '2', name: 'Perfil lipídico', takenDate: '19 sep', site: 'Loureles', status: 'ready' },
  { id: '3', name: 'Glisemia basal', takenDate: '19 sep', site: 'Loureles', status: 'issue' },
  { id: '4', name: 'Perfil Metabólico', takenDate: '13 sep', site: 'Loureles', status: 'processing' },
];

/**
 * Carga los exámenes de demostración la primera vez que arranca el servidor.
 * Es seguro llamarla en cada arranque: si la tabla ya tiene datos, no hace nada.
 */
export function seedDemoExams(): void {
  const { count } = db.prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM exams').get()!;
  if (count > 0) return;

  const insert = db.prepare(
    'INSERT INTO exams (id, name, taken_date, site, status) VALUES (@id, @name, @takenDate, @site, @status)',
  );

  const insertAll = db.transaction((exams: ExamRecord[]) => {
    exams.forEach((exam) => insert.run(exam));
  });

  insertAll(DEMO_EXAMS);
}
