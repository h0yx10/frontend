import { Component, EventEmitter, input, Output } from '@angular/core';

import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './confirm-dialog.component.html'
})

/* 
        aqui esta el componente de confirmacion,
         que es un modal que se puede usar para
          confirmar acciones peligrosas,
           como eliminar un elemento.
      */
export class ConfirmDialogComponent {
  readonly heading = input('¿Confirmar acción?');
  readonly message = input('Esta acción no se puede deshacer.');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly danger = input(true);
  readonly busy = input(false);

  @Output() readonly confirmed = new EventEmitter<void>();
  @Output() readonly cancelled = new EventEmitter<void>();
}
