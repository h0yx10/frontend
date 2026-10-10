import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavigationProgressService } from './core/layout/navigation-progress.service';
import { SpinnerComponent } from './shared/ui/atoms/spinner.component';

/** Raíz: el login es una ruta de pantalla completa y las rutas privadas viven dentro de `ShellLayoutComponent`. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SpinnerComponent],
  template: `
    <router-outlet />
    @if (!navigation.ready()) {
      <!-- Primera carga: los guards consultan la sesión antes de pintar nada. -->
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-canvas">
        <app-spinner class="text-ink" [size]="36" label="Cargando Eventia" />
      </div>
    }
  `
})
export class AppComponent {
  readonly navigation = inject(NavigationProgressService);
}
