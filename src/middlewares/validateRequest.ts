import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

import { ValidationError } from '../exceptions';

type RequestPart = 'body' | 'params' | 'query';

/**
 * Middleware generico de validacion: valida `req[part]` contra un schema de Zod.
 * Si los datos son validos, reemplaza `req[part]` por la version ya "parseada"
 * (con los espacios recortados, tipos convertidos, etc.) para que el controlador
 * reciba datos limpios y confiables.
 */
export function validateRequest(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => issue.message);
      next(new ValidationError('Los datos enviados no son validos.', details));
      return;
    }

    req[part] = result.data;
    next();
  };
}
