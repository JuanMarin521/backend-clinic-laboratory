import cors from 'cors';
import express, { type Express } from 'express';

import { API_BASE_PATH } from './config/constants';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { requestLogger } from './middlewares/requestLogger';
import { apiRouter } from './routes';

/**
 * Construye y configura la aplicacion Express.
 * Esta funcion SOLO ensambla piezas ya construidas en otras capas (middlewares, rutas);
 * no contiene logica de negocio ni de acceso a datos.
 *
 * Orden de los middlewares (importa mucho el orden en Express):
 * 1. cors            -> habilita que la app movil/web consuma la API desde otro origen.
 * 2. express.json    -> parsea el body de las peticiones como JSON.
 * 3. requestLogger   -> registra cada peticion entrante.
 * 4. apiRouter       -> todas las rutas de negocio, versionadas (/api/v1/...).
 * 5. notFoundHandler -> captura rutas que no existen (404).
 * 6. errorHandler    -> captura cualquier error lanzado por las capas anteriores (SIEMPRE al final).
 */
export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.use(requestLogger);

  app.use(API_BASE_PATH, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
