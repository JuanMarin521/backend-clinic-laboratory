import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { ConflictError, NotFoundError } from '../exceptions';
import { findExamByIdForUser, findExamsByUserId } from '../repositories/examRepository';
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
    fileName: `${exam.name.replace(/\s+/g, '_')}.pdf`,
    // Ruta real del endpoint que entrega los bytes del PDF (ver examController.downloadExamPdf).
    downloadUrl: `/api/v1/exams/${exam.id}/pdf/file`,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Genera el archivo PDF real (en memoria, con `pdf-lib`) del resultado de un examen.
 * Reusa las mismas validaciones de propiedad y estado que `getExamPdfInfo`.
 */
export async function generateExamPdfFile(
  examId: string,
  userId: string,
): Promise<{ fileName: string; bytes: Uint8Array }> {
  const exam = getDownloadableExam(examId, userId);

  const document = await PDFDocument.create();
  const page = document.addPage([420, 560]);
  const regularFont = await document.embedFont(StandardFonts.Helvetica);
  const boldFont = await document.embedFont(StandardFonts.HelveticaBold);

  const marginX = 40;
  let cursorY = 500;

  const writeLine = (text: string, options: { size?: number; bold?: boolean; gap?: number } = {}) => {
    const { size = 12, bold = false, gap = 22 } = options;
    page.drawText(text, {
      x: marginX,
      y: cursorY,
      size,
      font: bold ? boldFont : regularFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    cursorY -= gap;
  };

  writeLine('CPO Conecta', { size: 20, bold: true, gap: 28 });
  writeLine('Resultado de examen de laboratorio', { size: 12, gap: 32 });

  writeLine(exam.name, { size: 16, bold: true, gap: 26 });
  writeLine(`Fecha de toma de muestra: ${exam.takenDate}`);
  writeLine(`Sede: ${exam.site}`);
  writeLine(`Estado: ${exam.status === 'ready' ? 'Listo' : exam.status}`, { gap: 34 });

  page.drawLine({
    start: { x: marginX, y: cursorY },
    end: { x: 420 - marginX, y: cursorY },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  cursorY -= 24;

  writeLine('Este documento es una demostración generada automáticamente', { size: 9, gap: 14 });
  writeLine('por CPO Conecta y no sustituye un resultado médico oficial.', { size: 9, gap: 14 });

  const bytes = await document.save();

  return { fileName: `${exam.name.replace(/\s+/g, '_')}.pdf`, bytes };
}
