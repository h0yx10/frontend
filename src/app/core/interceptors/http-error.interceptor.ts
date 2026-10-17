import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { runtimeConfig } from '../config/runtime-config';

import { AuthStore } from '../auth/store/auth.store';

export interface OverloadErrorInfo {
  plannedHours: number;
  limitHours: number;
  exceedsBy: number;
}

export interface AppHttpError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  /** Presente en el 409 de sobrecarga (ver README.md#sobre-de-respuesta-estandar). */
  overload?: OverloadErrorInfo;
}

export const httpErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && request.url.startsWith(`${runtimeConfig.apiUrl}/`)
          && !auth.isPublicUrl(request.url) && auth.isAuthenticated()) {
        const path = request.url.split(/[?#]/)[0];
        // El store maneja el 401 de logout como sesión ya cerrada.
        if (request.method === 'POST' && path === `${runtimeConfig.apiUrl}/auth/logout`) {
          return throwError(() => toAppError(error));
        }
        const ownPasswordUpdate = request.method === 'PATCH' &&
          (path === `${runtimeConfig.apiUrl}/auth/me` ||
           path === `${runtimeConfig.apiUrl}/admin/users/${auth.user()?.id}`);
        if (ownPasswordUpdate) {
          // Un 401 por passwordActual no invalida el token: consultar /me primero.
          return auth.me().pipe(
            catchError(() => throwError(() => toAppError(error))),
            switchMap(() => throwError(() => toAppError(error)))
          );
        }
        auth.clearSession();
        router.navigate(['/login'], { queryParams: { expired: 1 } });
      }

      return throwError(() => toAppError(error));
    })
  );
};

function toAppError(error: HttpErrorResponse): AppHttpError {
  const fieldErrors: Record<string, string> = {};
  const errors = error.error?.errors as { field: string; message: string }[] | undefined;
  errors?.forEach((fieldError) => {
    fieldErrors[fieldError.field] = fieldError.message;
  });

  const message = getErrorMessage(error);
  const appError = new Error(message) as AppHttpError;
  appError.status = error.status;
  appError.fieldErrors = fieldErrors;

  if (error.status === 409) {
    const { plannedHours, limitHours, exceedsBy } = error.error ?? {};
    if (plannedHours !== undefined && limitHours !== undefined && exceedsBy !== undefined) {
      appError.overload = { plannedHours, limitHours, exceedsBy };
    }
  }

  return appError;
}

function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No fue posible conectar con el servidor.';
  }

  if (typeof error.error?.message === 'string' && error.error.message) {
    return error.error.message;
  }

  if (error.status === 403) {
    return 'No tienes permisos para acceder a este recurso.';
  }

  if (error.status === 404) {
    return error.error?.message ?? 'El recurso solicitado no existe.';
  }

  if (error.status >= 500) {
    return 'Ocurrio un inconveniente. Intentalo nuevamente mas tarde.';
  }

  return error.error?.message ?? 'La solicitud no pudo completarse.';
}
