import { AppError } from './AppError';

/** Error 409: la peticion entra en conflicto con el estado actual del recurso. */
export class ConflictError extends AppError {
  constructor(message = 'La solicitud entra en conflicto con el estado actual del recurso.') {
    super(message, 409, 'CONFLICT');
  }
}
