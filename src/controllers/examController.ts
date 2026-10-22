import type { Request, Response } from 'express';

import { UnauthorizedError } from '../exceptions';
import { asyncHandler } from '../utils/asyncHandler';
import { generateExamPdfFile, getExamPdfInfo, listExams } from '../services/examService';

/**
 * GET /api/v1/exams
 * Devuelve el listado de examenes del paciente autenticado junto con el resumen por estado.
 * Cada paciente SOLO ve sus propios examenes (filtrado por `req.user.id`).
 */
export const getExams = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const result = listExams(req.user.id);
  res.status(200).json({ success: true, data: result });
});

/**
 * GET /api/v1/exams/:examId/pdf
 * Devuelve la informacion (metadatos) de descarga del PDF de un examen especifico.
 * 404 si el examen no existe o no pertenece al paciente autenticado;
 * 409 si el examen existe pero aun no esta listo.
 */
export const getExamPdfInfoHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { examId } = req.params as { examId: string };
  const result = getExamPdfInfo(examId, req.user.id);

  res.status(200).json({ success: true, data: result });
});

/**
 * GET /api/v1/exams/:examId/pdf/file
 * Genera y entrega el archivo PDF real del examen (bytes, no JSON).
 * Usa las mismas validaciones de propiedad y estado que la ruta de metadatos.
 */
export const downloadExamPdf = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();

  const { examId } = req.params as { examId: string };
  const { fileName, bytes } = await generateExamPdfFile(examId, req.user.id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.status(200).send(Buffer.from(bytes));
});
