import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { CapacityStore } from './features/capacity/store/capacity.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly capacity = inject(CapacityStore);

  readonly isAuthenticated = computed(() => this.auth.isAuthenticated());
  readonly organizer = computed(() => this.auth.organizer());
  readonly dailyLimitHours = computed(() => this.capacity.dailyLimitHours());
  readonly navOpen = signal(false);
  searchTerm = '';

  readonly navItems = [
    { path: '/hoy', label: 'Hoy', icon: 'calendar_today' },
    { path: '/crear', label: 'Crear evento', icon: 'add_circle' },
    { path: '/progreso', label: 'Progreso', icon: 'bar_chart' }
  ];

  constructor() {
    effect(
      () => {
        if (this.isAuthenticated()) {
          this.capacity.ensureLoaded();
        }
      },
      { allowSignalWrites: true }
    );
  }

  get initials(): string {
    const name = this.organizer()?.name ?? '';
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  runSearch(): void {
    const term = this.searchTerm.trim();
    if (term) {
      this.router.navigate(['/progreso'], { queryParams: { q: term } });
    }
  }
}
