import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

import { runtimeConfig } from '../config/runtime-config';
import { ApiResponse } from '../http/api-response.model';
import { mockDb } from './mock-db';

const LATENCY_MS = 220;

/**
 * events-api no documenta endpoints de autenticación (ver README.md/eventos.md/etc.), así
 * que el login/registro de la demo se simula aquí contra localStorage. Todo lo demás —
 * eventos, subtareas, capacidad, conflictos, hoy — se deja pasar sin tocar para que hable
 * siempre con el backend real en `runtimeConfig.apiUrl`.
 */
export const mockApiInterceptor: HttpInterceptorFn = (request, next) => {
  const authUrl = `${runtimeConfig.apiUrl}/auth`;
  if (!request.url.startsWith(authUrl)) {
    return next(request);
  }

  const segments = request.url.slice(authUrl.length).split('?')[0].split('/').filter(Boolean);

  try {
    return handle(request, segments).pipe(delay(LATENCY_MS));
  } catch (error) {
    if (error instanceof MockApiError) {
      return fail(request, error.status, error.message, error.errors).pipe(delay(LATENCY_MS));
    }
    throw error;
  }
};

class MockApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: { field: string; message: string }[]
  ) {
    super(message);
  }
}

function handle(request: HttpRequest<unknown>, segments: string[]): Observable<HttpEvent<unknown>> {
  const method = request.method;

  if (method === 'POST' && segments[0] === 'login') {
    return handleLogin(request);
  }
  if (method === 'POST' && segments[0] === 'register') {
    return handleRegister(request);
  }
  if (method === 'GET' && segments[0] === 'me') {
    return ok(request, requireAuth(request));
  }

  throw new MockApiError(404, 'El recurso solicitado no existe.');
}

function handleLogin(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const body = request.body as { email: string; password: string };
  const organizer = body?.email ? mockDb.findOrganizerByEmail(body.email) : undefined;

  if (!organizer || !mockDb.verifyPassword(organizer, body?.password ?? '')) {
    throw new MockApiError(401, 'Credenciales inválidas.');
  }

  const token = mockDb.createToken(organizer.id);
  return ok(request, { token, organizer: mockDb.toPublicOrganizer(organizer) });
}

function handleRegister(request: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const body = request.body as { name: string; email: string; password: string };
  const errors: { field: string; message: string }[] = [];

  if (!body?.name?.trim()) {
    errors.push({ field: 'name', message: 'El nombre es obligatorio.' });
  }
  if (!body?.email?.trim()) {
    errors.push({ field: 'email', message: 'El correo es obligatorio.' });
  }
  if (!body?.password || body.password.length < 6) {
    errors.push({ field: 'password', message: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  if (errors.length) {
    throw new MockApiError(400, 'Revisa los campos del formulario.', errors);
  }
  if (mockDb.findOrganizerByEmail(body.email)) {
    throw new MockApiError(400, 'Ya existe una cuenta con ese correo.', [
      { field: 'email', message: 'Este correo ya está registrado.' }
    ]);
  }

  const organizer = mockDb.createOrganizer(body);
  const token = mockDb.createToken(organizer.id);
  return ok(request, { token, organizer }, 201);
}

function requireAuth(request: HttpRequest<unknown>) {
  const header = request.headers.get('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const organizer = mockDb.resolveToken(token);
  if (!organizer) {
    throw new MockApiError(401, 'Debes iniciar sesión para continuar.');
  }
  return organizer;
}

function ok<T>(request: HttpRequest<unknown>, data: T, status = 200): Observable<HttpEvent<unknown>> {
  const body: ApiResponse<T> = {
    success: true,
    message: 'OK',
    data,
    timestamp: new Date().toISOString()
  };
  return of(new HttpResponse({ status, body, url: request.url }));
}

function fail(
  request: HttpRequest<unknown>,
  status: number,
  message: string,
  errors?: { field: string; message: string }[]
): Observable<never> {
  return of(null).pipe(
    switchMap(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status,
            url: request.url,
            error: { success: false, message, errors, timestamp: new Date().toISOString() }
          })
      )
    )
  );
}
