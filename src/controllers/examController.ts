import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/asyncHandler';
import { getExamPdf, listExams } from '../services/examService';

/**
 * GET /api/v1/exams
 * Devuelve el listado de examenes del paciente autenticado junto con el resumen por estado.
 * (Requiere autenticacion: ver `authMiddleware` en las rutas).
 */
export const getExams = asyncHandler(async (_req: Request, res: Response) => {
  const result = listExams();
  res.status(200).json({ success: true, data: result });
});

/**
 * GET /api/v1/exams/:examId/pdf
 * Devuelve la informacion de descarga simulada del PDF de un examen especifico.
 */
export const getExamPdfInfo = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params as { examId: string };
  const result = getExamPdf(examId);

  res.status(200).json({ success: true, data: result });
});
