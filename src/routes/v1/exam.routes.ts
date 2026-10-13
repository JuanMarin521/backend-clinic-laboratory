import { Router } from 'express';

import { getExamPdfInfo, getExams } from '../../controllers/examController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { examIdParamSchema } from '../../validators/paramValidators';

/**
 * Rutas de examenes: /api/v1/exams
 * Todas requieren autenticacion (token JWT valido).
 * - GET /             : lista los examenes y el resumen por estado.
 * - GET /:examId/pdf  : informacion de descarga del PDF de un examen.
 */
const router = Router();

router.use(authMiddleware);

router.get('/', getExams);
router.get('/:examId/pdf', validateRequest(examIdParamSchema, 'params'), getExamPdfInfo);

export { router as examRouter };
