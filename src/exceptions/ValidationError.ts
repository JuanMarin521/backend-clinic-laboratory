import { AppError } from './AppError';

/**
 * Error 400: los datos enviados por el cliente no cumplen el formato esperado.
 * `details` contiene la lista de campos especificos que fallaron (uno por linea).
 */
export class ValidationError extends AppError {
  public readonly details: string[];

  constructor(message: string, details: string[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}
