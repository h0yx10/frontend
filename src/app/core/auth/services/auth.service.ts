import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { runtimeConfig } from '../../config/runtime-config';
import { ApiResponse } from '../../http/api-response.model';
import {
  AuthResponseDto,
  LoginPayload,
  LoginRequestDto,
  RegisterPayload,
  RegisterRequestDto,
  UpdateProfileRequestDto,
  UsuarioResponseDto
} from '../models/auth.model';

/** Transporte HTTP de autenticación. El estado de sesión pertenece a AuthStore. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${runtimeConfig.apiUrl}/auth`;

  isPublicUrl(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    return path === `${this.url}/login` || path === `${this.url}/register`;
  }

  login(payload: LoginPayload) {
    const body: LoginRequestDto = { correo: payload.email.trim(), password: payload.password };
    return this.http.post<ApiResponse<AuthResponseDto>>(`${this.url}/login`, body);
  }

  register(payload: RegisterPayload) {
    const body: RegisterRequestDto = {
      nombre: payload.name.trim(), correo: payload.email.trim(), password: payload.password
    };
    return this.http.post<ApiResponse<AuthResponseDto>>(`${this.url}/register`, body);
  }

  me() {
    return this.http.get<ApiResponse<UsuarioResponseDto>>(`${this.url}/me`);
  }

  updateProfile(body: UpdateProfileRequestDto) {
    return this.http.patch<ApiResponse<UsuarioResponseDto>>(`${this.url}/me`, body);
  }

  logout() {
    return this.http.post<ApiResponse<null>>(`${this.url}/logout`, null);
  }

  deleteAccount() {
    return this.http.delete<ApiResponse<null>>(`${this.url}/me`);
  }
}
