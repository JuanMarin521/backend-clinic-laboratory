import { Router } from 'express';

import { login, register } from '../../controllers/authController';
import { enrollBiometric, loginBiometric, revokeBiometric } from '../../controllers/biometricController';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginSchema, registerSchema } from '../../validators/authValidators';
import {
  biometricEnrollSchema,
  biometricLoginSchema,
  biometricRevokeSchema,
} from '../../validators/biometricValidators';

/**
 * Rutas de autenticacion: /api/v1/auth
 * - POST /register : crea un nuevo paciente.
 * - POST /login     : inicia sesion y devuelve un token (con bloqueo tras 5 intentos fallidos).
 * - POST /biometric/enroll : (con sesion) activa el ingreso biometrico en este dispositivo.
 * - POST /biometric/login  : inicia sesion con el token del dispositivo (lo rota).
 * - POST /biometric/revoke : desactiva el ingreso biometrico de este dispositivo.
 */
const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

router.post('/biometric/enroll', authMiddleware, validateRequest(biometricEnrollSchema), enrollBiometric);
router.post('/biometric/login', validateRequest(biometricLoginSchema), loginBiometric);
router.post('/biometric/revoke', validateRequest(biometricRevokeSchema), revokeBiometric);

export { router as authRouter };
