import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { BrandMarkComponent } from '../../atoms/brand-mark.component';
import { SpinnerComponent } from '../../atoms/spinner.component';
import { WorkloadCardComponent } from '../../molecules/workload-card.component';

export interface SidebarItem {
  path: string;
  label: string;
  icon: string;
  /** Contador opcional junto a la etiqueta; no se muestra si es 0 o no está definido. */
  badge?: number;
  /** Muestra un spinner en lugar del contador mientras se consulta por primera vez. */
  loading?: boolean;
}

export interface SidebarWorkload {
  planned: number;
  limit: number;
  loading: boolean;
  ready: boolean;
}

/**
 * Navegación lateral de las pantallas autenticadas. Es presentacional: recibe los datos ya resueltos
 * y emite eventos; quien lo compone decide qué hacer con la navegación y el cierre de sesión.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatIconModule, BrandMarkComponent, SpinnerComponent, WorkloadCardComponent],
  templateUrl: './app-sidebar.component.html',
  styles: `:host { display: block; height: 100%; }`
})
export class AppSidebarComponent {
  readonly items = input.required<readonly SidebarItem[]>();
  readonly userName = input('');
  readonly userRole = input('');
  readonly workload = input<SidebarWorkload | null>(null);
  /** Muestra el punto de aviso en la campana. */
  readonly alerts = input(false);
  readonly loggingOut = input(false);

  readonly logout = output<void>();
  /** Se emite al elegir un destino; el drawer móvil lo usa para cerrarse. */
  readonly navigated = output<void>();

  readonly homePath = computed(() => this.items()[0]?.path ?? '/cuenta');
  readonly initial = computed(() => this.userName().trim().charAt(0).toUpperCase() || '?');
}
