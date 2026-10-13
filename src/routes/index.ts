import { Router } from 'express';

import { API_V1_PATH } from '../config/constants';
import { v1Router } from './v1';

/** Enruta cada version de la API bajo su propio prefijo (ej. /api/v1, en el futuro /api/v2). */
const router = Router();

router.use(API_V1_PATH, v1Router);

export { router as apiRouter };
