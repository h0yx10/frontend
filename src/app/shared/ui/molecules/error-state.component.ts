import { Component, EventEmitter, input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './error-state.component.html'
})
export class ErrorStateComponent {
  readonly title = input('No pudimos cargar la información');
  readonly message = input('Intenta nuevamente en unos segundos.');

  @Output() readonly retry = new EventEmitter<void>();
}
