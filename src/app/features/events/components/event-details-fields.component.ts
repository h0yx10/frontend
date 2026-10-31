import { Component, inject, input } from '@angular/core';
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';

import { FormFieldComponent } from '../../../shared/ui/molecules/form-field.component';
import { EVENT_TYPE_OPTIONS } from '../models/event.model';

/**
 * Campos de los datos de un evento (nombre, tipo, fecha inicio, hora, lugar, contacto y fecha límite).
 * Se coloca dentro de un `[formGroup]` que tenga los controles de `eventDetailsControls`: así Nuevo evento
 * y la edición del detalle muestran exactamente los mismos campos, en el mismo orden.
 */
@Component({
  selector: 'app-event-details-fields',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
  templateUrl: './event-details-fields.component.html',
  styles: `:host { display: flex; flex-direction: column; gap: 1.25rem; }`
})
export class EventDetailsFieldsComponent {
  /** Errores por campo, con las claves del backend (`nombre`, `tipo`, `fechaHora`, `hora`, `plazoLimite`). */
  readonly errors = input<Record<string, string>>({});
  /** Primer día elegible para la fecha de inicio. */
  readonly minDate = input('');

  readonly typeOptions = EVENT_TYPE_OPTIONS;
  private readonly container = inject(FormGroupDirective);

  get form() {
    return this.container.form;
  }

  get selectedType(): string {
    return this.form.get('type')?.value ?? '';
  }

  selectType(type: string): void {
    this.form.get('type')?.setValue(type);
  }

  /** La fecha límite parte de la fecha de inicio, y nunca antes del primer día elegible. */
  deadlineMin(): string {
    const date: string = this.form.get('date')?.value ?? '';
    return date > this.minDate() ? date : this.minDate();
  }
}
