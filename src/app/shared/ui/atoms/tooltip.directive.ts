import { Directive, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Etiqueta flotante para botones de icono: `<button appTooltip="Editar">`.
 * Envuelve el tooltip de Angular Material (accesible, con teclado y táctil) con el estilo de la app.
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: ['matTooltip: appTooltip', 'matTooltipPosition: appTooltipPosition', 'matTooltipDisabled: appTooltipDisabled']
    }
  ]
})
export class TooltipDirective {
  constructor() {
    const tooltip = inject(MatTooltip);
    tooltip.tooltipClass = 'app-tooltip';
    tooltip.showDelay = 250;
    tooltip.position = 'above';
  }
}
