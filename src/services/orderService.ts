import { ConflictError, NotFoundError } from '../exceptions';
import { findExamsByOrderId } from '../repositories/examRepository';
import { findLatestOrderByUserId, findOrderByNumberForUser, findOrdersByUserId } from '../repositories/orderRepository';
import { findUserById } from '../repositories/userRepository';
import type { OrderRecord, OrderWithExams } from '../types/order.types';
import { summarize } from './examService';
import { buildResultsPdf } from './pdf/resultsPdfDocument';

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

/**
 * Genera UN solo PDF con todos los examenes VALIDADOS de una orden.
 * - 404 si la orden no existe o es de otro paciente (no se distingue, para no revelar nada).
 * - 409 si la orden todavia no tiene ningun examen validado.
 * Los examenes en proceso o con novedad no se incluyen; el PDF indica cuantos faltan.
 */
export async function generateOrderPdfFile(
  orderNumber: string,
  userId: string,
): Promise<{ fileName: string; bytes: Uint8Array }> {
  const order = findOrderByNumberForUser(orderNumber, userId);
  if (!order) throw new NotFoundError(`No existe la orden #${orderNumber} para este paciente.`);

  const exams = findExamsByOrderId(order.id);
  const validated = exams.filter((exam) => exam.status === 'ready');
  if (validated.length === 0) {
    throw new ConflictError('Esta orden todavia no tiene examenes validados para descargar.');
  }

  const bytes = await buildResultsPdf({
    patientName: findUserById(userId)?.fullName ?? 'Paciente',
    orderNumber: order.orderNumber,
    orderDate: order.date,
    site: order.site,
    validatedExams: validated.map((exam) => exam.name),
    pendingCount: exams.length - validated.length,
  });

  return { fileName: `Orden_${order.orderNumber}.pdf`, bytes };
}
