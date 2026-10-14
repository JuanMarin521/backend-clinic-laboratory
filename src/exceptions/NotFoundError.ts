import { AppError } from './AppError';

/** Error 404: el recurso solicitado no existe. */
export class NotFoundError extends AppError {
  constructor(message = 'El recurso solicitado no existe.') {
    super(message, 404, 'NOT_FOUND');
  }
}
