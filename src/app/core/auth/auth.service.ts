import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

import { runtimeConfig } from '../config/runtime-config';
import { ApiResponse } from '../http/api-response.model';
import {
  AuthResponseDto,
  AuthSession,
  LoginPayload,
  LoginRequestDto,
  RegisterPayload,
  RegisterRequestDto,
  Role,
  User,
  UsuarioResponseDto
} from './auth.model';

const SESSION_STORAGE_KEY = 'events_planner::session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${runtimeConfig.apiUrl}/auth`;

  private readonly session = signal<AuthSession | null>(this.readStoredSession());
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly token = computed(() => this.session()?.token ?? null);

  constructor() {
    const session = this.session();
    if (session) {
      this.scheduleExpiry(session.expiresAt);
    }
  }

  /** Rutas públicas: no llevan `Authorization` y un 401 en ellas no cierra sesión. */
  isPublicUrl(url: string): boolean {
    return url.startsWith(`${this.url}/login`) || url.startsWith(`${this.url}/register`);
  }

  login(payload: LoginPayload): Observable<User> {
    const body: LoginRequestDto = { correo: payload.email.trim(), password: payload.password };
    return this.http
      .post<ApiResponse<AuthResponseDto>>(`${this.url}/login`, body)
      .pipe(map((response) => this.startSession(response.data)));
  }

  register(payload: RegisterPayload): Observable<User> {
    const body: RegisterRequestDto = {
      nombre: payload.name.trim(),
      correo: payload.email.trim(),
      password: payload.password
    };
    return this.http
      .post<ApiResponse<AuthResponseDto>>(`${this.url}/register`, body)
      .pipe(map((response) => this.startSession(response.data)));
  }

  /**
   * Al recargar la app con un token vigente, refresca el usuario con `GET /auth/me`.
   * Si responde 401, `httpErrorInterceptor` cierra la sesión y redirige a /login.
   */
  restoreSession(): void {
    if (!this.session()) {
      return;
    }

    this.me().subscribe({ error: () => undefined });
  }

  me(): Observable<User> {
    return this.http.get<ApiResponse<UsuarioResponseDto>>(`${this.url}/me`).pipe(
      map((response) => mapUserFromDto(response.data)),
      tap((user) => {
        const session = this.session();
        if (session) {
          this.persist({ ...session, user });
        }
      })
    );
  }

  hasRole(role: Role): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  /** No hay endpoint de logout: el token es stateless, basta con borrarlo en el cliente. */
  logout(): void {
    this.clearExpiryTimer();
    this.session.set(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private startSession(dto: AuthResponseDto): User {
    const session: AuthSession = {
      token: dto.accessToken,
      expiresAt: Date.now() + dto.expiresIn * 1000,
      user: mapUserFromDto(dto.usuario)
    };
    this.persist(session);
    this.scheduleExpiry(session.expiresAt);
    return session.user;
  }

  private persist(session: AuthSession): void {
    this.session.set(session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  /** No hay refresh token: al expirar, el usuario debe volver a iniciar sesión. */
  private scheduleExpiry(expiresAt: number): void {
    this.clearExpiryTimer();
    this.expiryTimer = setTimeout(() => {
      this.logout();
      this.router.navigate(['/login']);
    }, Math.max(expiresAt - Date.now(), 0));
  }

  private clearExpiryTimer(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  private readStoredSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const session = JSON.parse(raw) as AuthSession;
      if (!session.token || !session.user || !(session.expiresAt > Date.now())) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }
}

function mapUserFromDto(dto: UsuarioResponseDto): User {
  return {
    id: dto.id,
    name: dto.nombre,
    email: dto.correo,
    roles: dto.roles,
    active: dto.activo,
    createdAt: dto.createdAt
  };
}
