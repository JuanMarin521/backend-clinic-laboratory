import type { Request, Response } from 'express';

/** Middleware final para cualquier ruta que no coincidio con ninguna definida (404 generico). */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `La ruta ${req.method} ${req.originalUrl} no existe.`,
    },
  });
}
