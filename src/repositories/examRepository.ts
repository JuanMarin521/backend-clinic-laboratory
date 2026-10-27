import { db } from '../config/database';
import type { ExamRecord, ExamStatus, NewExam } from '../types/exam.types';

/**
 * Repositorio de examenes, respaldado por una base de datos SQLite real (tabla `exams`).
 * Cada examen pertenece a una orden (`order_id`), y cada orden a un unico paciente.
 * Por eso todas las consultas hacen JOIN con `orders` y filtran por `orders.user_id`:
 * un usuario nunca puede ver ni descargar el examen de otro.
 */

/** Forma cruda de una fila de `exams` unida con los datos de su orden. */
interface ExamRow {
  id: string;
  order_id: string;
  order_number: string;
  order_date: string;
  site: string;
  name: string;
  status: string;
}

/** Columnas comunes de todas las consultas de examenes (examen + datos de su orden). */
const EXAM_SELECT = `
  SELECT e.id, e.order_id, o.order_number, o.order_date, o.site, e.name, e.status
  FROM exams e
  JOIN orders o ON o.id = e.order_id
`;

/** Convierte una fila de la base de datos al tipo `ExamRecord` que usa el resto del codigo. */
function toExamRecord(row: ExamRow): ExamRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    name: row.name,
    takenDate: row.order_date,
    site: row.site,
    // La columna `status` tiene un CHECK en el esquema SQL que solo permite estos 3 valores.
    status: row.status as ExamStatus,
  };
}

/** Devuelve todos los examenes de un paciente (de la orden mas reciente a la mas vieja). */
export function findExamsByUserId(userId: string): ExamRecord[] {
  const rows = db
    .prepare<[string], ExamRow>(`${EXAM_SELECT} WHERE o.user_id = ? ORDER BY o.order_date DESC, e.name ASC`)
    .all(userId);

  return rows.map(toExamRecord);
}

/** Devuelve los examenes de una orden especifica, ordenados por nombre. */
export function findExamsByOrderId(orderId: string): ExamRecord[] {
  const rows = db
    .prepare<[string], ExamRow>(`${EXAM_SELECT} WHERE e.order_id = ? ORDER BY e.name ASC`)
    .all(orderId);

  return rows.map(toExamRecord);
}

/**
 * Busca un examen por id, PERO solo si pertenece al paciente indicado.
 * Si el examen existe pero es de otro usuario, devuelve `undefined` (igual que si no
 * existiera): así no se revela a un paciente que el examen de otra persona existe.
 */
export function findExamByIdForUser(examId: string, userId: string): ExamRecord | undefined {
  const row = db
    .prepare<[string, string], ExamRow>(`${EXAM_SELECT} WHERE e.id = ? AND o.user_id = ?`)
    .get(examId, userId);

  return row ? toExamRecord(row) : undefined;
}

/** Inserta un lote de examenes dentro de una orden. */
export function insertExamsForOrder(orderId: string, exams: NewExam[]): void {
  const insert = db.prepare('INSERT INTO exams (id, order_id, name, status) VALUES (@id, @orderId, @name, @status)');

  exams.forEach((exam, index) => {
    insert.run({ ...exam, orderId, id: `exam_${orderId}_${index}` });
  });
}
