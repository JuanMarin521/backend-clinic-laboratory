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

/** Mensajes que un paciente puede enviar al chat por minuto (protege la cuota de la IA). */
export const MAX_CHAT_MESSAGES_PER_MINUTE = 8;

/** Mensajes previos de la conversacion que recibe la IA como contexto. */
export const AI_HISTORY_MESSAGES = 12;

/** Tiempo maximo de espera de la IA. Debe ser menor al timeout de la app (10 s) para alcanzar a usar el respaldo. */
export const AI_TIMEOUT_MS = 8000;

/** Intentos fallidos de contrasena seguidos antes de bloquear temporalmente el ingreso de ese usuario. */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** Minutos que dura el bloqueo despues de superar los intentos fallidos. */
export const LOGIN_LOCKOUT_MINUTES = 15;

/** Dias que dura una credencial biometrica de dispositivo sin usarse (se renueva en cada ingreso). */
export const DEVICE_CREDENTIAL_TTL_DAYS = 30;
