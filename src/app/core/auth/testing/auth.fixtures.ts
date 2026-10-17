import { AuthResponseDto, User, UsuarioResponseDto } from '../models/auth.model';
import { ApiResponse } from '../../http/api-response.model';

export const usuario: UsuarioResponseDto = {
  id: 'account-id', organizadorId: 'profile-id', nombre: 'Ana', correo: 'ana@example.com',
  roles: ['ORGANIZADOR'], activo: true, createdAt: '2026-10-03T10:00:00'
};

export const user: User = {
  id: usuario.id, organizerId: usuario.organizadorId, name: usuario.nombre, email: usuario.correo,
  roles: ['ORGANIZADOR'], active: true, createdAt: usuario.createdAt
};

export const sessionDto: AuthResponseDto = {
  accessToken: 'test-token', tokenType: 'Bearer', expiresIn: 7200, usuario
};

export function success<T>(data: T, message = 'Mensaje del backend.'): ApiResponse<T> {
  return { success: true, message, data, timestamp: '2026-10-03T15:00:00Z' };
}
