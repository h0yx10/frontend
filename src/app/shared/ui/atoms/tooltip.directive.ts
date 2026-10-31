import { Directive, inject } from '@angular/core';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltip, MatTooltipDefaultOptions } from '@angular/material/tooltip';

/** Por defecto, arriba y con una pausa corta. Son valores por defecto: `appTooltipPosition` los sobrescribe. */
const TOOLTIP_DEFAULTS: MatTooltipDefaultOptions = {
  position: 'above',
  showDelay: 250,
  hideDelay: 0,
  touchendHideDelay: 1500
};

/**
 * Etiqueta flotante para botones de icono: `<button appTooltip="Editar">`.
 * Envuelve el tooltip de Angular Material (accesible, con teclado y táctil) con el estilo de la app.
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
  providers: [{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: TOOLTIP_DEFAULTS }],
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: ['matTooltip: appTooltip', 'matTooltipPosition: appTooltipPosition', 'matTooltipDisabled: appTooltipDisabled']
    }
  ]
})
export class TooltipDirective {
  constructor() {
    // La clase no es configurable por defecto en esta versión de Material; no choca con ninguna entrada.
    inject(MatTooltip).tooltipClass = 'app-tooltip';
  }
}
