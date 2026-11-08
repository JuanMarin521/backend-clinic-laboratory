import { AppError } from './AppError';

/** Error 429: se superaron los intentos permitidos y hay que esperar antes de volver a intentar. */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Demasiados intentos. Intenta de nuevo mas tarde.') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}
