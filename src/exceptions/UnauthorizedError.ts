import { AppError } from './AppError';

/** Error 401: credenciales invalidas o token ausente/expirado/invalido. */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado. Verifica tus credenciales.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
