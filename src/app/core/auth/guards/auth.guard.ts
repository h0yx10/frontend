import { catchError, map, of } from 'rxjs';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '../store/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  return router.parseUrl(auth.homeUrl());
};

/** Refresca los roles de BD antes de abrir una ruta de negocio. */
export const organizerGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth.me().pipe(
    map(() => auth.canOrganize() ? true : router.createUrlTree(['/cuenta'])),
    catchError(() => of(router.createUrlTree(['/cuenta'])))
  );
};
