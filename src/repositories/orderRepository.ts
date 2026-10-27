import { randomInt } from 'node:crypto';

import { db } from '../config/database';
import type { NewExam } from '../types/exam.types';
import type { OrderRecord } from '../types/order.types';
import { insertExamsForOrder } from './examRepository';

/**
 * Repositorio de ordenes (tabla `orders`).
 * Una orden agrupa los examenes de una misma visita al laboratorio. Reglas:
 * - el numero de orden (6 digitos) no se repite en todo el sistema (`UNIQUE`);
 * - un paciente solo puede tener una orden por dia (`UNIQUE (user_id, order_date)`);
 * - los numeros son CONSECUTIVOS: la primera orden recibe un numero aleatorio de 6 cifras
 *   y cada orden nueva recibe el siguiente (max + 1). Como las ordenes se crean en orden
 *   cronologico, una orden mas reciente siempre tiene un numero mayor.
 */

/** Forma cruda de una fila de la tabla `orders`. */
interface OrderRow {
  id: string;
  user_id: string;
  order_number: string;
  order_date: string;
  site: string;
}

function toOrderRecord(row: OrderRow): OrderRecord {
  return { id: row.id, orderNumber: row.order_number, date: row.order_date, site: row.site };
}

/** Devuelve las ordenes de un paciente, de la mas reciente a la mas antigua. */
export function findOrdersByUserId(userId: string): OrderRecord[] {
  const rows = db
    .prepare<[string], OrderRow>('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC')
    .all(userId);

  return rows.map(toOrderRecord);
}

/** Devuelve la orden mas reciente de un paciente (la de su ultima visita), o `undefined` si no tiene. */
export function findLatestOrderByUserId(userId: string): OrderRecord | undefined {
  const row = db
    .prepare<[string], OrderRow>('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC LIMIT 1')
    .get(userId);

  return row ? toOrderRecord(row) : undefined;
}

/** Rango del primer numero de orden. Se deja espacio hasta 999999 para las ordenes siguientes. */
const FIRST_ORDER_NUMBER_MIN = 100000;
const FIRST_ORDER_NUMBER_MAX = 899999;

/**
 * Siguiente numero de orden: el mayor que exista + 1, o un numero aleatorio de 6 cifras
 * si todavia no hay ninguna orden en la base de datos.
 */
function nextOrderNumber(): string {
  const row = db
    .prepare<[], { maxNumber: number | null }>('SELECT MAX(CAST(order_number AS INTEGER)) AS maxNumber FROM orders')
    .get();

  if (!row?.maxNumber) return String(randomInt(FIRST_ORDER_NUMBER_MIN, FIRST_ORDER_NUMBER_MAX + 1));

  const next = row.maxNumber + 1;
  if (next > 999999) throw new Error('Se agotaron los numeros de orden de 6 cifras.');
  return String(next);
}

/**
 * Crea una orden con sus examenes (todo en una sola transaccion) y le asigna el
 * siguiente numero de orden consecutivo.
 * Si el paciente ya tiene una orden ese dia, SQLite rechaza la insercion por la
 * restriccion `UNIQUE (user_id, order_date)`; quien llama debe validarlo antes.
 */
export function createOrderWithExams(
  userId: string,
  data: { date: string; site: string; exams: NewExam[] },
): OrderRecord {
  const create = db.transaction((): OrderRecord => {
    const order: OrderRecord = {
      id: `order_${userId}_${data.date}`,
      orderNumber: nextOrderNumber(),
      date: data.date,
      site: data.site,
    };

    db.prepare(
      'INSERT INTO orders (id, user_id, order_number, order_date, site) VALUES (@id, @userId, @orderNumber, @date, @site)',
    ).run({ ...order, userId });

    insertExamsForOrder(order.id, data.exams);
    return order;
  });

  return create();
}

/** Borra TODAS las ordenes (y sus examenes, por el ON DELETE CASCADE). Solo la usa la siembra de datos. */
export function deleteAllOrders(): void {
  db.exec('DELETE FROM orders');
}
