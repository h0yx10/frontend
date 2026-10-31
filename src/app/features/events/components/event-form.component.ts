import { Component, computed, EventEmitter, inject, input, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { todayIsoDate } from '../../../core/utils/date.util';
import { EventPayload } from '../models/event.model';
import { EventDetailsFieldsComponent } from './event-details-fields.component';
import { eventDetailsControls, eventDetailsValue, toEventPayload, validateEventDetails } from './event-details.form';

/** Edición de un evento: los mismos campos y reglas que Nuevo evento. */
@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [ReactiveFormsModule, EventDetailsFieldsComponent],
  templateUrl: './event-form.component.html'
})
export class EventFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  readonly initial = input<EventPayload | null>(null);
  readonly fieldErrors = input<Record<string, string>>({});
  readonly saving = input(false);
  readonly submitLabel = input('Guardar');
  readonly showCancel = input(false);

  @Output() readonly save = new EventEmitter<EventPayload>();
  @Output() readonly cancel = new EventEmitter<void>();

  readonly today = todayIsoDate();
  private readonly localErrors = signal<Record<string, string>>({});
  readonly errors = computed(() => ({ ...this.localErrors(), ...this.fieldErrors() }));

  readonly form = this.formBuilder.nonNullable.group(eventDetailsControls(this.formBuilder));
  private originalDate = '';

  /** Primer día elegible: hoy, o la fecha que el evento ya tenía si es anterior (se puede conservar). */
  get minDate(): string {
    return this.originalDate && this.originalDate < this.today ? this.originalDate : this.today;
  }

  ngOnInit(): void {
    const initial = this.initial();
    if (initial) {
      this.form.reset(eventDetailsValue(initial));
      this.originalDate = this.form.controls.date.value;
    }
  }

  submit(): void {
    const value = this.form.getRawValue();
    const errors = validateEventDetails(value, this.today, this.originalDate);
    this.localErrors.set(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    this.save.emit(toEventPayload(value));
  }
}
