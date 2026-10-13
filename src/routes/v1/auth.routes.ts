import { Router } from 'express';

import { login, register } from '../../controllers/authController';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginSchema, registerSchema } from '../../validators/authValidators';

/**
 * Rutas de autenticacion: /api/v1/auth
 * - POST /register : crea un nuevo paciente.
 * - POST /login     : inicia sesion y devuelve un token.
 */
const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

export { router as authRouter };
