import { Router } from 'express';

import { createMessage, getMessages } from '../../controllers/chatController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { createMessageSchema } from '../../validators/supportValidators';

/**
 * Rutas de soporte/chat: /api/v1/support
 * Requieren autenticacion (el mensaje queda asociado al usuario del token).
 * - GET  /messages : historial de la conversacion del paciente.
 * - POST /messages : envia un mensaje y recibe la respuesta del asistente.
 */
const router = Router();

router.use(authMiddleware);

router.get('/messages', getMessages);
router.post('/messages', validateRequest(createMessageSchema), createMessage);

export { router as supportRouter };
