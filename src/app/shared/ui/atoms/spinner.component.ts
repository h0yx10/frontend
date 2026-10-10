import { Component, input } from '@angular/core';

/**
 * Indicador de carga estilo iOS: ocho barras que se desvanecen en círculo.
 * Toma el color del texto que lo rodea (`currentColor`), así funciona igual en un botón o en una tarjeta.
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  host: {
    class: 'ios',
    '[attr.role]': 'label() ? "status" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[style.--s.px]': 'size()'
  },
  template: '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>',
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent {
  /** Lado en píxeles. */
  readonly size = input(28);
  /** Texto para lectores de pantalla; vacío cuando ya hay un texto visible que explica la carga. */
  readonly label = input('Cargando');
}
