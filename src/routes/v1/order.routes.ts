import { Router } from 'express';

import { downloadOrderPdf, getLatestOrderHandler, getOrders } from '../../controllers/orderController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { orderNumberParamSchema } from '../../validators/paramValidators';

/**
 * Rutas de ordenes: /api/v1/orders
 * Todas requieren autenticacion. Cada paciente solo ve SUS PROPIAS ordenes.
 * - GET /        : todas las ordenes del paciente con sus examenes (historial).
 * - GET /latest  : solo la orden mas reciente (pantalla de Inicio).
 * - GET /:orderNumber/pdf/file : un solo PDF con los examenes validados de la orden.
 */
const router = Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.get('/latest', getLatestOrderHandler);
router.get('/:orderNumber/pdf/file', validateRequest(orderNumberParamSchema, 'params'), downloadOrderPdf);

export { router as orderRouter };
