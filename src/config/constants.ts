/**
 * Constantes de negocio que no dependen del entorno de ejecucion.
 * Agrupar estos valores aqui evita "numeros magicos" repartidos por el codigo.
 */

/** Prefijo base de todas las rutas de la API. */
export const API_BASE_PATH = '/api';

/** Version actual de la API (permite agregar /api/v2 en el futuro sin romper /api/v1). */
export const API_V1_PATH = '/v1';

/** Longitud minima aceptada para usuario y nombre completo. */
export const MIN_USERNAME_LENGTH = 4;

/** Longitud minima aceptada para la contrasena. */
export const MIN_PASSWORD_LENGTH = 4;

/** Longitud maxima de un mensaje de chat enviado al asistente. */
export const MAX_CHAT_MESSAGE_LENGTH = 500;
