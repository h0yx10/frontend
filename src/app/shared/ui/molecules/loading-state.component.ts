import { Component, input } from '@angular/core';

import { SpinnerComponent } from '../atoms/spinner.component';

/** Estado de carga de una sección o página: spinner centrado con un mensaje breve. */
@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-center" role="status" aria-live="polite">
      <app-spinner class="text-ink" [size]="32" label="" />
      <p class="text-sm text-muted">{{ message() }}</p>
    </div>
  `,
  styles: `:host { display: block; }`
})
export class LoadingStateComponent {
  readonly message = input('Cargando…');
}
