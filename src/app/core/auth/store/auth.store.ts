import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';

import { ApiResponse } from '../../http/api-response.model';
import {
  AuthResponseDto,
  AuthSession,
  LoginPayload,
  RegisterPayload,
  Role,
  User,
  UpdateProfileRequestDto,
  UsuarioResponseDto
} from '../models/auth.model';

import { AuthService } from '../services/auth.service';

const SESSION_STORAGE_KEY = 'events_planner::session';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly service = inject(AuthService);
  private readonly router = inject(Router);

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
    return this.service.isPublicUrl(url);
  }

  login(payload: LoginPayload): Observable<User> {
    return this.service.login(payload).pipe(map((response) => this.startSession(response.data)));
  }

  register(payload: RegisterPayload): Observable<User> {
    return this.service.register(payload).pipe(map((response) => this.startSession(response.data)));
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
    return this.service.me().pipe(
      map((response) => mapUserFromDto(response.data)),
      tap((user) => {
        const session = this.session();
        if (session) {
          this.persist({ ...session, user });
        }
      })
    );
  }

  updateProfile(body: UpdateProfileRequestDto): Observable<ApiResponse<User>> {
    return this.service.updateProfile(body).pipe(
      map((response) => ({ ...response, data: mapUserFromDto(response.data) })),
      tap((response) => {
        const session = this.session();
        if (session) this.persist({ ...session, user: response.data });
      })
    );
  }

  deleteAccount(): Observable<ApiResponse<null>> {
    return this.service.deleteAccount().pipe(tap(() => this.clearSession()));
  }

  readonly canOrganize = computed(() => this.hasRole('ORGANIZADOR') && this.user()?.active === true);
  readonly homeUrl = computed(() => this.canOrganize() ? '/hoy' : '/cuenta');

  hasRole(role: Role): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  /** Revoca el JWT actual. Red/500 conservan la sesión para poder reintentar. */
  logout(): Observable<void> {
    return this.service.logout().pipe(
      tap(() => this.clearSession()),
      map(() => undefined),
      catchError((error) => {
        if (error.status === 401) {
          this.clearSession();
          return of(undefined);
        }
        return throwError(() => error);
      })
    );
  }

  /** Limpieza local tras revocación confirmada, eliminación o sesión inválida. */
  clearSession(): void {
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
      this.clearSession();
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
    organizerId: dto.organizadorId,
    name: dto.nombre,
    email: dto.correo,
    roles: dto.roles,
    active: dto.activo,
    createdAt: dto.createdAt
  };
}
