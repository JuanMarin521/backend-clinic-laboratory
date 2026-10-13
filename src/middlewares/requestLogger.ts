import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware de logging simple: imprime metodo, ruta, codigo de estado
 * y tiempo de respuesta de cada peticion. Util para depurar durante el desarrollo.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    // eslint-disable-next-line no-console
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
}
