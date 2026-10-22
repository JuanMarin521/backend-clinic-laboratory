import { Router } from 'express';

import { downloadExamPdf, getExamPdfInfoHandler, getExams } from '../../controllers/examController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { examIdParamSchema } from '../../validators/paramValidators';

/**
 * Rutas de examenes: /api/v1/exams
 * Todas requieren autenticacion (token JWT valido). Cada paciente solo puede
 * ver y descargar SUS PROPIOS examenes.
 * - GET /                  : lista los examenes del paciente y el resumen por estado.
 * - GET /:examId/pdf       : informacion (metadatos) de descarga del PDF de un examen.
 * - GET /:examId/pdf/file  : el archivo PDF real (bytes), listo para abrir o guardar.
 */
const router = Router();

router.use(authMiddleware);

router.get('/', getExams);
router.get('/:examId/pdf', validateRequest(examIdParamSchema, 'params'), getExamPdfInfoHandler);
router.get('/:examId/pdf/file', validateRequest(examIdParamSchema, 'params'), downloadExamPdf);

export { router as examRouter };
