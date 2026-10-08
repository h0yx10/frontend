import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { filter, finalize } from 'rxjs';

import { BrandMarkComponent } from '../../shared/ui/atoms/brand-mark.component';
import { AppSidebarComponent, SidebarItem } from '../../shared/ui/organisms/app-sidebar/app-sidebar.component';
import { AuthStore } from '../auth/store/auth.store';
import { CapacityStore } from '../../features/capacity/store/capacity.store';
import { WorkloadStore } from '../../features/today/store/workload.store';

/**
 * Layout de las rutas privadas. Es un componente de ruta (no un `@if` en la raíz): así el router
 * sustituye el login por el shell y la página destino en el mismo paso, sin un instante intermedio
 * con el login dentro del shell mientras se resuelven los guards.
 *
 * Es la raíz de composición de la zona privada: conecta los stores de sesión, capacidad y carga diaria
 * con la barra lateral, que es puramente presentacional.
 */
@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, MatIconModule, BrandMarkComponent, AppSidebarComponent],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
export class ShellLayoutComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly capacity = inject(CapacityStore);
  private readonly workload = inject(WorkloadStore);

  readonly user = computed(() => this.auth.user());
  readonly roleLabel = computed(() => (this.auth.hasRole('ADMIN') ? 'Administrador' : 'Organizador'));
  readonly navOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly logoutError = signal('');

  readonly canOrganize = this.auth.canOrganize;
  readonly navItems = computed<SidebarItem[]>(() =>
    this.canOrganize()
      ? [
          { path: '/hoy', label: 'Hoy', icon: 'calendar_today', badge: this.workload.attentionCount() },
          { path: '/actividades', label: 'Actividades', icon: 'format_list_bulleted' },
          { path: '/progreso', label: 'Progreso', icon: 'bar_chart' }
        ]
      : []
  );
  readonly sidebarWorkload = computed(() =>
    this.canOrganize() ? { planned: this.workload.plannedHours(), limit: this.capacity.dailyLimitHours() } : null
  );
  readonly hasAlerts = computed(() => this.workload.overdueCount() > 0);

  constructor() {
    effect(
      () => {
        if (this.auth.isAuthenticated() && this.canOrganize()) {
          this.capacity.ensureLoaded();
        }
      },
      { allowSignalWrites: true }
    );

    // La carga diaria cambia al crear o completar gestiones en otras pantallas: se refresca al terminar cada navegación.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe(() => {
        if (this.canOrganize()) this.workload.refresh();
      });
  }

  logout(): void {
    if (this.loggingOut()) return;
    this.loggingOut.set(true);
    this.logoutError.set('');
    this.auth.logout().pipe(finalize(() => this.loggingOut.set(false))).subscribe({
      next: () => {
        this.navOpen.set(false);
        this.router.navigate(['/login']);
      },
      error: (error: Error) => this.logoutError.set(error.message)
    });
  }

  runSearch(term: string): void {
    if (term && this.canOrganize()) {
      this.router.navigate(['/progreso'], { queryParams: { q: term } });
    }
  }
}
