import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../auth/auth.service';

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
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.isAuthenticated()) {
        auth.logout();
        router.navigate(['/login']);
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

  if (error.status === 404) {
    return error.error?.message ?? 'El recurso solicitado no existe.';
  }

  if (error.status >= 500) {
    return 'El servidor presentó un error. Intenta nuevamente.';
  }

  return error.error?.message ?? 'La solicitud no pudo completarse.';
}
