/** Datos del perfil del paciente que puede actualizar desde la app (todos opcionales). */
export interface ProfileFields {
  /** Numero de documento de identidad (solo digitos). */
  documentNumber: string | null;
  email: string | null;
  /** Celular (solo digitos). */
  phone: string | null;
  address: string | null;
  /** Fecha de nacimiento, formato ISO "YYYY-MM-DD". */
  birthDate: string | null;
}

/** Representa un usuario tal como se guarda internamente (incluye el hash de la contrasena). */
export interface UserRecord extends ProfileFields {
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

/** Perfil completo del paciente que ve la pantalla de Perfil (SIN la contrasena). */
export interface UserProfile extends PublicUser, ProfileFields {
  /** Fecha de creacion de la cuenta (ISO). */
  createdAt: string;
}

/** Datos que se pueden cambiar desde "Actualizar datos". */
export interface UpdateProfileInput extends ProfileFields {
  fullName: string;
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
