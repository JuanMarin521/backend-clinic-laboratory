import { Router } from 'express';

import { changePasswordHandler, getProfileHandler, updateProfileHandler } from '../../controllers/profileController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { changePasswordSchema, updateProfileSchema } from '../../validators/profileValidators';

/**
 * Rutas del perfil del paciente: /api/v1/profile
 * Todas requieren autenticacion y siempre actuan sobre el paciente del token.
 * - GET   /          : perfil completo (nombre, usuario, documento, contacto...).
 * - PATCH /          : actualiza nombre y datos de contacto.
 * - PATCH /password  : cambia la contrasena (pide la actual).
 */
const router = Router();

router.use(authMiddleware);

router.get('/', getProfileHandler);
router.patch('/', validateRequest(updateProfileSchema), updateProfileHandler);
router.patch('/password', validateRequest(changePasswordSchema), changePasswordHandler);

export { router as profileRouter };
