import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from '@angular/router';

/** Navegaciones más rápidas que esto no muestran indicador: evita destellos en cambios instantáneos. */
const SHOW_AFTER_MS = 120;

/**
 * Expone la navegación en curso. Los guards consultan el backend (p. ej. `/auth/me`) antes de
 * activar la ruta; mientras tanto la pantalla no cambia, así que la UI necesita saber qué se está cargando.
 */
@Injectable({ providedIn: 'root' })
export class NavigationProgressService {
  /** URL que se está resolviendo, o `null` si no hay navegación pendiente (o aún es muy reciente). */
  readonly pendingUrl = signal<string | null>(null);
  /** Pasa a verdadero al completar la primera navegación: antes no hay ninguna pantalla en pie. */
  readonly ready = signal(false);

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          clearTimeout(this.timer);
          this.timer = setTimeout(() => this.pendingUrl.set(event.url), SHOW_AFTER_MS);
        } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
          clearTimeout(this.timer);
          this.pendingUrl.set(null);
          // Una redirección (p. ej. de un guard al login) continúa con otra navegación: aún no hay pantalla.
          const redirected = event instanceof NavigationCancel &&
            (event.code === NavigationCancellationCode.Redirect || event.code === NavigationCancellationCode.SupersededByNewNavigation);
          if (!redirected) this.ready.set(true);
        }
      });
  }

  /** Si la navegación pendiente va hacia `path` o una ruta hija. */
  isPending(path: string): boolean {
    const url = this.pendingUrl()?.split(/[?#]/)[0];
    return !!url && (url === path || url.startsWith(`${path}/`));
  }
}
