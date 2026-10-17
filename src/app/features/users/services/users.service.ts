import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { CreateUserRequestDto, UpdateUserRequestDto, UsuarioResponseDto } from '../../../core/auth/models/auth.model';
import { runtimeConfig } from '../../../core/config/runtime-config';
import { ApiResponse } from '../../../core/http/api-response.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly url = `${runtimeConfig.apiUrl}/admin/users`;

  list() { return this.http.get<ApiResponse<UsuarioResponseDto[]>>(this.url); }
  get(id: string) { return this.http.get<ApiResponse<UsuarioResponseDto>>(`${this.url}/${encodeURIComponent(id)}`); }
  create(body: CreateUserRequestDto) { return this.http.post<ApiResponse<UsuarioResponseDto>>(this.url, body); }
  update(id: string, body: UpdateUserRequestDto) {
    return this.http.patch<ApiResponse<UsuarioResponseDto>>(`${this.url}/${encodeURIComponent(id)}`, body);
  }
  delete(id: string) { return this.http.delete<ApiResponse<null>>(`${this.url}/${encodeURIComponent(id)}`); }
}
