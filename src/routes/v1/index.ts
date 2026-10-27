import { Router } from 'express';

import { authRouter } from './auth.routes';
import { examRouter } from './exam.routes';
import { orderRouter } from './order.routes';
import { profileRouter } from './profile.routes';
import { supportRouter } from './support.routes';

/**
 * Agrupa todas las rutas de la version 1 de la API.
 * Para agregar una version 2 en el futuro, se creara `routes/v2` siguiendo
 * el mismo patron, sin tocar ni romper las rutas existentes de v1.
 */
const router = Router();

/** Ruta de salud, util para confirmar que el servidor esta corriendo. */
router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', version: 'v1' } });
});

router.use('/auth', authRouter);
router.use('/exams', examRouter);
router.use('/orders', orderRouter);
router.use('/profile', profileRouter);
router.use('/support', supportRouter);

export { router as v1Router };
