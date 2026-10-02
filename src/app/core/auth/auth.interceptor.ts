import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { runtimeConfig } from '../config/runtime-config';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(runtimeConfig.apiUrl)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const token = auth.token();
  if (!token || auth.isPublicUrl(request.url)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    })
  );
};
