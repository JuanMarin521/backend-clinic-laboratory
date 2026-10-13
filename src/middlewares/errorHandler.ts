import type { NextFunction, Request, Response } from 'express';

import { isDevelopment } from '../config/env';
import { AppError, ValidationError } from '../exceptions';

/**
 * Middleware centralizado de manejo de errores (se declara al final de la cadena de middlewares).
 * Es el UNICO lugar de la aplicacion donde se decide el formato de respuesta de un error.
 *
 * - Si es un `AppError` (ValidationError, UnauthorizedError, NotFoundError, ConflictError):
 *   se devuelve su codigo de estado y mensaje especifico.
 * - Si es cualquier otro error inesperado: se devuelve un 500 generico y se registra en consola,
 *   para no filtrar detalles internos del servidor al cliente.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Error no controlado: se registra completo en el servidor pero no se expone al cliente.
  // eslint-disable-next-line no-console
  console.error('Error inesperado:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrio un error inesperado en el servidor.',
      ...(isDevelopment && err instanceof Error ? { debug: err.message } : {}),
    },
  });
}
