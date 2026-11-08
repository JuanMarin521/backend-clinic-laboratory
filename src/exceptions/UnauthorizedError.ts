import { AppError } from './AppError';

/**
 * Error 401: credenciales invalidas o token ausente/expirado/invalido.
 * `code` permite distinguir casos: 'UNAUTHORIZED' (credenciales) o 'SESSION_INVALID'
 * (el token de sesion falta, vencio o no es valido: la app debe volver al login).
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado. Verifica tus credenciales.', code: 'UNAUTHORIZED' | 'SESSION_INVALID' = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}
