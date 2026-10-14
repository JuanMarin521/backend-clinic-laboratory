/**
 * Carga y valida las variables de entorno del servidor.
 *
 * Esta es la UNICA pieza del codigo que lee `process.env` directamente.
 * El resto de la aplicacion consume el objeto `env` ya validado y tipado,
 * para evitar errores de tipeo en nombres de variables repartidos por todo el codigo.
 */
import 'dotenv/config';

/** Lanza un error claro si falta una variable de entorno obligatoria. */
function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`La variable de entorno "${name}" es obligatoria y no fue definida.`);
  }
  return value;
}

/** Convierte un valor de entorno a numero, con un valor por defecto si no es valido. */
function toNumber(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  /** Puerto HTTP donde escucha el servidor Express. */
  port: toNumber(requireEnv('PORT', '4000'), 4000),

  /** Entorno de ejecucion actual. */
  nodeEnv: requireEnv('NODE_ENV', 'development'),

  /** Clave secreta usada para firmar y verificar los tokens JWT. */
  jwtSecret: requireEnv('JWT_SECRET', 'cpo-conecta-dev-secret-change-me'),

  /** Tiempo de expiracion de los tokens JWT (ej. "2h", "7d"). */
  jwtExpiresIn: requireEnv('JWT_EXPIRES_IN', '2h'),

  /** Numero de rondas de encriptacion para las contrasenas (bcrypt). */
  bcryptSaltRounds: toNumber(requireEnv('BCRYPT_SALT_ROUNDS', '10'), 10),

  /** Origen permitido para peticiones CORS. */
  corsOrigin: requireEnv('CORS_ORIGIN', '*'),

  /** Ruta del archivo de base de datos SQLite (relativa a la raiz del proyecto backend). */
  databasePath: requireEnv('DATABASE_PATH', './data/cpo-conecta.db'),
} as const;

/** Indica si el servidor esta corriendo en modo desarrollo. */
export const isDevelopment = env.nodeEnv === 'development';
