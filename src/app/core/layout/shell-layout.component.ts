import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { finalize } from 'rxjs';

import { BrandLogoComponent } from '../../shared/ui/atoms/brand-logo.component';
import { ProgressBarComponent } from '../../shared/ui/atoms/progress-bar.component';
import { AuthStore } from '../auth/store/auth.store';
import { CapacityStore } from '../../features/capacity/store/capacity.store';

@Component({
  selector: 'app-shell-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, FormsModule, BrandLogoComponent, ProgressBarComponent],
  templateUrl: './shell-layout.component.html',
  styleUrl: './shell-layout.component.scss'
})
/**
 * Layout de las rutas privadas. Es un componente de ruta (no un `@if` en la raíz): así el router
 * sustituye el login por el shell y la página destino en el mismo paso, sin un instante intermedio
 * con el login dentro del shell mientras se resuelven los guards.
 */
export class ShellLayoutComponent {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly capacity = inject(CapacityStore);

  readonly user = computed(() => this.auth.user());
  readonly roleLabel = computed(() => (this.auth.hasRole('ADMIN') ? 'Administrador' : 'Organizador'));
  readonly dailyLimitHours = computed(() => this.capacity.dailyLimitHours());
  readonly navOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly logoutError = signal('');
  searchTerm = '';

  readonly canOrganize = this.auth.canOrganize;
  readonly navItems = computed(() => [
    { path: '/cuenta', label: 'Mi cuenta', icon: 'person' },
    ...(this.canOrganize() ? [
    { path: '/hoy', label: 'Hoy', icon: 'calendar_today' },
    { path: '/crear', label: 'Crear evento', icon: 'add_circle' },
    { path: '/actividades', label: 'Actividades', icon: 'event_note' },
    { path: '/progreso', label: 'Progreso', icon: 'bar_chart' }
    ] : [])
  ]);

  constructor() {
    effect(
      () => {
        if (this.auth.isAuthenticated() && this.canOrganize()) {
          this.capacity.ensureLoaded();
        }
      },
      { allowSignalWrites: true }
    );
  }

  get initials(): string {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
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

  runSearch(): void {
    const term = this.searchTerm.trim();
    if (term && this.canOrganize()) {
      this.router.navigate(['/progreso'], { queryParams: { q: term } });
    }
  }
}
