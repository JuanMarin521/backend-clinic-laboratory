import { Router } from 'express';

import { getLatestOrderHandler, getOrders } from '../../controllers/orderController';
import { authMiddleware } from '../../middlewares/authMiddleware';

/**
 * Rutas de ordenes: /api/v1/orders
 * Todas requieren autenticacion. Cada paciente solo ve SUS PROPIAS ordenes.
 * - GET /        : todas las ordenes del paciente con sus examenes (historial).
 * - GET /latest  : solo la orden mas reciente (pantalla de Inicio).
 */
const router = Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.get('/latest', getLatestOrderHandler);

export { router as orderRouter };
