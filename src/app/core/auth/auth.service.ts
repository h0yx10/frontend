import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { runtimeConfig } from '../config/runtime-config';
import { ApiResponse } from '../http/api-response.model';
import { AuthSession, LoginPayload, Organizer, RegisterPayload } from './auth.model';

const SESSION_STORAGE_KEY = 'events_planner::session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = `${runtimeConfig.apiUrl}/auth`;

  private readonly session = signal<AuthSession | null>(this.restoreSession());

  readonly organizer = computed<Organizer | null>(() => this.session()?.organizer ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly token = computed(() => this.session()?.token ?? null);

  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http
      .post<ApiResponse<AuthSession>>(`${this.url}/login`, payload)
      .pipe(
        map((response) => response.data),
        tap((session) => this.setSession(session))
      );
  }

  register(payload: RegisterPayload): Observable<AuthSession> {
    return this.http
      .post<ApiResponse<AuthSession>>(`${this.url}/register`, payload)
      .pipe(
        map((response) => response.data),
        tap((session) => this.setSession(session))
      );
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  private setSession(session: AuthSession): void {
    this.session.set(session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private restoreSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }
}
