export type Role = 'ORGANIZADOR' | 'ADMIN';

export interface User {
  id: string;
  organizerId: string | null;
  name: string;
  email: string;
  roles: Role[];
  active: boolean;
  createdAt: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  /** Epoch en ms: `Date.now() + expiresIn * 1000` al momento del login. */
  expiresAt: number;
  user: User;
}

export const NAME_MAX_LENGTH = 120;
export const EMAIL_MAX_LENGTH = 180;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

// --- Contrato real del backend (events-api) — ver contratos de autenticación ---

export interface LoginRequestDto {
  correo: string;
  password: string;
}

export interface RegisterRequestDto {
  nombre: string;
  correo: string;
  password: string;
}

export interface UsuarioResponseDto {
  id: string;
  organizadorId: string | null;
  nombre: string;
  correo: string;
  roles: Role[];
  activo: boolean;
  createdAt: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  /** Segundos. */
  expiresIn: number;
  usuario: UsuarioResponseDto;
}

export interface UpdateProfileRequestDto {
  nombre?: string | null;
  correo?: string | null;
  password?: string | null;
  passwordActual?: string | null;
}

export interface CreateUserRequestDto extends RegisterRequestDto {
  roles?: Role[];
}

export interface UpdateUserRequestDto extends UpdateProfileRequestDto {
  roles?: Role[];
  activo?: boolean | null;
}
