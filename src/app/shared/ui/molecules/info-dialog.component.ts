import { Component, EventEmitter, input, Output } from '@angular/core';

import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-info-dialog',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './info-dialog.component.html'
})
export class InfoDialogComponent {
  readonly heading = input('Acción realizada');
  readonly message = input('La acción se realizó correctamente.');
  readonly acceptLabel = input('Aceptar');

  @Output() readonly accepted = new EventEmitter<void>();
}
