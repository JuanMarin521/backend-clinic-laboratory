/** Representa un usuario tal como se guarda internamente (incluye el hash de la contrasena). */
export interface UserRecord {
  id: string;
  fullName: string;
  /** Nombre de usuario normalizado en minusculas (se usa para buscar e iniciar sesion). */
  username: string;
  passwordHash: string;
  createdAt: string;
}

/** Representa un usuario tal como se expone al cliente (SIN la contrasena). */
export interface PublicUser {
  id: string;
  fullName: string;
  username: string;
}

/** Datos necesarios para registrar un nuevo usuario. */
export interface RegisterInput {
  fullName: string;
  username: string;
  password: string;
}

/** Datos necesarios para iniciar sesion. */
export interface LoginInput {
  username: string;
  password: string;
}
