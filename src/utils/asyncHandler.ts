import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Envuelve un controlador asincrono para capturar automaticamente cualquier
 * error (incluidas promesas rechazadas) y enviarlo al middleware de errores
 * via `next(error)`, en lugar de tener que escribir try/catch en cada controlador.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
