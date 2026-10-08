import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, input, output, viewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { BrandMarkComponent } from '../../atoms/brand-mark.component';
import { WorkloadCardComponent } from '../../molecules/workload-card.component';

export interface SidebarItem {
  path: string;
  label: string;
  icon: string;
  /** Contador opcional junto a la etiqueta; no se muestra si es 0 o no está definido. */
  badge?: number;
}

export interface SidebarWorkload {
  planned: number;
  limit: number;
}

/**
 * Navegación lateral de las pantallas autenticadas. Es presentacional: recibe los datos ya resueltos
 * y emite eventos; quien lo compone decide qué hacer con la búsqueda y el cierre de sesión.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, RouterLinkActive, MatIconModule, BrandMarkComponent, WorkloadCardComponent],
  templateUrl: './app-sidebar.component.html',
  styles: `:host { display: block; height: 100%; }`
})
export class AppSidebarComponent {
  readonly items = input.required<readonly SidebarItem[]>();
  readonly userName = input('');
  readonly userRole = input('');
  readonly searchable = input(false);
  readonly workload = input<SidebarWorkload | null>(null);
  /** Muestra el punto de aviso en la campana. */
  readonly alerts = input(false);
  readonly loggingOut = input(false);

  readonly search = output<string>();
  readonly logout = output<void>();
  /** Se emite al elegir un destino; el drawer móvil lo usa para cerrarse. */
  readonly navigated = output<void>();

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly homePath = computed(() => this.items()[0]?.path ?? '/cuenta');
  readonly initial = computed(() => this.userName().trim().charAt(0).toUpperCase() || '?');
  readonly shortcut = /Mac|iPhone|iPad/i.test(globalThis.navigator?.platform ?? '') ? '⌘K' : 'Ctrl K';

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  /** ⌘K / Ctrl+K enfoca la búsqueda; con dos instancias (escritorio y drawer) sólo responde la visible. */
  @HostListener('window:keydown', ['$event'])
  onShortcut(event: KeyboardEvent): void {
    const input = this.searchInput()?.nativeElement;
    if (!input || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k' || !input.offsetParent) return;
    event.preventDefault();
    input.focus();
    input.select();
  }

  submitSearch(): void {
    const term = this.searchControl.value.trim();
    if (!term) return;
    this.search.emit(term);
    this.searchControl.reset('');
    this.navigated.emit();
  }
}
