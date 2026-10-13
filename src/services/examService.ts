import { ConflictError, NotFoundError } from '../exceptions';
import { findAllExams, findExamById } from '../repositories/examRepository';
import type { ExamPdfResponse, ExamRecord, ExamStatus } from '../types/exam.types';

/** Resumen de cuantos examenes hay en cada estado (para las tarjetas "semaforo" del Home). */
export interface ExamSummary {
  ready: number;
  processing: number;
  issue: number;
}

/** Forma de la respuesta del listado de examenes. */
export interface ExamListResult {
  summary: ExamSummary;
  exams: ExamRecord[];
}

/** Calcula cuantos examenes hay por cada estado. */
function summarize(exams: ExamRecord[]): ExamSummary {
  const summary: ExamSummary = { ready: 0, processing: 0, issue: 0 };

  exams.forEach((exam) => {
    summary[exam.status] += 1;
  });

  return summary;
}

/** Devuelve todos los examenes junto con el resumen por estado. */
export function listExams(): ExamListResult {
  const exams = findAllExams();
  return { summary: summarize(exams), exams };
}

/** Estados en los que SI se permite descargar el PDF del examen. */
const DOWNLOADABLE_STATUSES: ExamStatus[] = ['ready'];

/**
 * Genera la informacion de descarga simulada del PDF de un examen.
 * Lanza `NotFoundError` (404) si el examen no existe.
 * Lanza `ConflictError` (409) si el examen todavia no esta listo para descargar.
 */
export function getExamPdf(examId: string): ExamPdfResponse {
  const exam = findExamById(examId);

  if (!exam) {
    throw new NotFoundError(`No existe un examen con id "${examId}".`);
  }

  if (!DOWNLOADABLE_STATUSES.includes(exam.status)) {
    throw new ConflictError('Este examen todavia no esta listo para descargar su PDF.');
  }

  // No hay almacenamiento real de archivos en este MVP: se simula la URL de descarga.
  return {
    examId: exam.id,
    fileName: `${exam.name.replace(/\s+/g, '_')}.pdf`,
    downloadUrl: `https://cpo-conecta.local/files/exams/${exam.id}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}
