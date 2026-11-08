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

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

/** Clave de desarrollo. Es publica (esta en el repositorio), por eso NUNCA se acepta en produccion. */
const DEV_JWT_SECRET = 'cpo-conecta-dev-secret-change-me';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

/**
 * En desarrollo, si falta JWT_SECRET se usa la clave de desarrollo.
 * En produccion el servidor NO arranca si falta, si es la de desarrollo o si es corta:
 * con una clave conocida cualquiera podria fabricar tokens validos.
 */
function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!IS_PRODUCTION) return secret ?? DEV_JWT_SECRET;

  if (!secret || secret === DEV_JWT_SECRET || secret.length < MIN_PRODUCTION_SECRET_LENGTH) {
    throw new Error(
      `En produccion JWT_SECRET es obligatoria, distinta a la de desarrollo y de al menos ${MIN_PRODUCTION_SECRET_LENGTH} caracteres.`,
    );
  }
  return secret;
}

/**
 * CORS_ORIGIN acepta "*" (cualquier origen) o una lista separada por comas
 * (ej. "http://localhost:8081,https://app.cpo.com"). En produccion "*" no se permite.
 */
function resolveCorsOrigins(): '*' | string[] {
  const raw = (process.env.CORS_ORIGIN ?? (IS_PRODUCTION ? '' : '*')).trim();
  if (raw === '*') {
    if (IS_PRODUCTION) throw new Error('En produccion CORS_ORIGIN no puede ser "*": indica los origenes permitidos.');
    return '*';
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
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
  nodeEnv: NODE_ENV,

  /** Clave secreta usada para firmar y verificar los tokens JWT (ver `resolveJwtSecret`). */
  jwtSecret: resolveJwtSecret(),

  /** Tiempo de expiracion de los tokens JWT (ej. "2h", "7d"). */
  jwtExpiresIn: requireEnv('JWT_EXPIRES_IN', '2h'),

  /** Numero de rondas de encriptacion para las contrasenas (bcrypt). */
  bcryptSaltRounds: toNumber(requireEnv('BCRYPT_SALT_ROUNDS', '10'), 10),

  /**
   * Origenes permitidos para CORS (ver `resolveCorsOrigins`). La app movil no necesita CORS;
   * solo aplica cuando la app corre en un navegador (Expo web).
   */
  corsOrigins: resolveCorsOrigins(),

  /** Ruta del archivo de base de datos SQLite (relativa a la raiz del proyecto backend). */
  databasePath: requireEnv('DATABASE_PATH', './data/cpo-conecta.db'),

  /**
   * Clave de la API de Google Gemini para el asistente con IA del chat. Es OPCIONAL:
   * si no se define, el chat responde con el asistente por palabras clave.
   * Vive solo en el `.env` del servidor (que no se sube al repositorio) y nunca se envia a la app.
   */
  geminiApiKey: (process.env.GEMINI_API_KEY ?? '').trim(),

  /** Modelo de Gemini que usa el chat (lista de modelos: https://ai.google.dev/models). */
  geminiModel: (process.env.GEMINI_MODEL ?? '').trim() || 'gemini-3.5-flash-lite',
} as const;

/** Indica si el servidor esta corriendo en modo desarrollo. */
export const isDevelopment = env.nodeEnv === 'development';
