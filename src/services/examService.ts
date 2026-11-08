import { ConflictError, NotFoundError } from '../exceptions';
import { findExamByIdForUser, findExamsByUserId } from '../repositories/examRepository';
import { findUserById } from '../repositories/userRepository';
import type { ExamPdfResponse, ExamRecord, ExamStatus } from '../types/exam.types';
import type { ExamSummary } from '../types/order.types';
import { toPdfFileName } from '../utils/fileName';
import { buildResultsPdf } from './pdf/resultsPdfDocument';

/** Forma de la respuesta del listado de examenes. */
export interface ExamListResult {
  summary: ExamSummary;
  exams: ExamRecord[];
}

/** Calcula cuantos examenes hay por cada estado. */
export function summarize(exams: ExamRecord[]): ExamSummary {
  const summary: ExamSummary = { ready: 0, processing: 0, issue: 0 };

  exams.forEach((exam) => {
    summary[exam.status] += 1;
  });

  return summary;
}

/** Devuelve los examenes del paciente autenticado junto con el resumen por estado. */
export function listExams(userId: string): ExamListResult {
  const exams = findExamsByUserId(userId);
  return { summary: summarize(exams), exams };
}

/** Estados en los que SI se permite descargar el PDF del examen. */
const DOWNLOADABLE_STATUSES: ExamStatus[] = ['ready'];

/**
 * Busca el examen de un paciente y valida que se pueda descargar.
 * Lanza `NotFoundError` (404) si el examen no existe O si pertenece a otro paciente
 * (a proposito no se distingue el motivo, para no revelar que el examen de otra
 * persona existe). Lanza `ConflictError` (409) si el examen aun no esta listo.
 */
function getDownloadableExam(examId: string, userId: string): ExamRecord {
  const exam = findExamByIdForUser(examId, userId);

  if (!exam) {
    throw new NotFoundError(`No existe un examen con id "${examId}" para este paciente.`);
  }

  if (!DOWNLOADABLE_STATUSES.includes(exam.status)) {
    throw new ConflictError('Este examen todavia no esta listo para descargar su PDF.');
  }

  return exam;
}

/** Genera la informacion (metadatos) de descarga del PDF de un examen. */
export function getExamPdfInfo(examId: string, userId: string): ExamPdfResponse {
  const exam = getDownloadableExam(examId, userId);

  return {
    examId: exam.id,
    fileName: toPdfFileName(exam.name),
    // Ruta real del endpoint que entrega los bytes del PDF (ver examController.downloadExamPdf).
    downloadUrl: `/api/v1/exams/${exam.id}/pdf/file`,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Genera el archivo PDF real (en memoria) del resultado de un examen.
 * Reusa las mismas validaciones de propiedad y estado que `getExamPdfInfo`.
 */
export async function generateExamPdfFile(
  examId: string,
  userId: string,
): Promise<{ fileName: string; bytes: Uint8Array }> {
  const exam = getDownloadableExam(examId, userId);

  const bytes = await buildResultsPdf({
    patientName: findUserById(userId)?.fullName ?? 'Paciente',
    orderNumber: exam.orderNumber,
    orderDate: exam.takenDate,
    site: exam.site,
    validatedExams: [exam.name],
    pendingCount: 0,
  });

  return { fileName: toPdfFileName(exam.name), bytes };
}
