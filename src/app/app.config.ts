import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { AuthStore } from './core/auth/store/auth.store';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([httpErrorInterceptor, authInterceptor])),
    {
      // No bloquea el arranque: la sesión guardada se usa de inmediato y `/auth/me` la valida en paralelo.
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AuthStore],
      useFactory: (auth: AuthStore) => () => auth.restoreSession()
    }
  ]
};
