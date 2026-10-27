import { findExamsByOrderId } from '../repositories/examRepository';
import { findLatestOrderByUserId, findOrdersByUserId } from '../repositories/orderRepository';
import type { OrderRecord, OrderWithExams } from '../types/order.types';
import { summarize } from './examService';

/** Completa una orden con sus examenes y el resumen por estado (semaforo). */
function withExams(order: OrderRecord): OrderWithExams {
  const exams = findExamsByOrderId(order.id);
  return { ...order, summary: summarize(exams), exams };
}

/** Todas las ordenes del paciente (de la mas reciente a la mas antigua), cada una con sus examenes. */
export function listOrders(userId: string): OrderWithExams[] {
  return findOrdersByUserId(userId).map(withExams);
}

/**
 * La orden mas reciente del paciente (los examenes de su ultima visita al laboratorio),
 * o `null` si todavia no tiene ninguna. Es lo que muestra la pantalla de Inicio.
 */
export function getLatestOrder(userId: string): OrderWithExams | null {
  const order = findLatestOrderByUserId(userId);
  return order ? withExams(order) : null;
}
