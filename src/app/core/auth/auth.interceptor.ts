import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { runtimeConfig } from '../config/runtime-config';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(runtimeConfig.apiUrl)) {
    return next(request);
  }

  const token = inject(AuthService).token();
  if (!token) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};
