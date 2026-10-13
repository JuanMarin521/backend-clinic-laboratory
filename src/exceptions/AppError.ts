/**
 * Clase base para todos los errores "esperados" de la aplicacion
 * (errores de negocio, no fallas inesperadas del sistema).
 *
 * `isOperational = true` le indica al errorHandler que es un error controlado
 * y que puede devolverse al cliente de forma segura (con su propio mensaje).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean = true;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;

    // Mantiene el nombre de la clase hija (ej. "NotFoundError") en el stack trace.
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
