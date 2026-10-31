import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';

import { formatIsoDateShort, todayIsoDate } from '../../core/utils/date.util';
import { AppHttpError, OverloadErrorInfo } from '../../core/interceptors/http-error.interceptor';
import { FormFieldComponent } from '../../shared/ui/molecules/form-field.component';
import { InfoDialogComponent } from '../../shared/ui/molecules/info-dialog.component';
import { PageHeaderComponent } from '../../shared/ui/molecules/page-header.component';
import { EVENT_TYPE_OPTIONS, EventPayload, SubtareaInicialRequestDto } from './models/event.model';
import { EventsService } from './services/events.service';

interface DraftSubtask {
  name: string;
  targetDate: string;
  estimatedHours: number | null;
}

@Component({
  selector: 'app-event-create-page',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, MatIconModule, RouterLink, FormFieldComponent, InfoDialogComponent, PageHeaderComponent],
  templateUrl: './event-create-page.component.html'
})
export class EventCreatePageComponent {
  private readonly eventsService = inject(EventsService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly typeOptions = EVENT_TYPE_OPTIONS;
  readonly formatIsoDateShort = formatIsoDateShort;
  /** Primer día válido para el evento: no se programan eventos en el pasado. */
  readonly today = todayIsoDate();
  readonly saving = signal(false);
  readonly createdEventId = signal<string | null>(null);
  readonly error = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly draftError = signal('');
  readonly overload = signal<OverloadErrorInfo | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    name: '',
    type: EVENT_TYPE_OPTIONS[0],
    date: '',
    time: '',
    place: '',
    contact: '',
    deadline: '',
    /** Subtarea que se está redactando; pasa a `rows` con "Agregar". */
    draft: this.formBuilder.nonNullable.group({ name: '', targetDate: '', hours: 1 as number | null })
  });

  readonly rowsSignal = signal<DraftSubtask[]>([]);
  readonly totalHours = computed(() => this.rowsSignal().reduce((total, row) => total + Number(row.estimatedHours ?? 0), 0));

  get rows(): DraftSubtask[] {
    return this.rowsSignal();
  }

  set rows(rows: DraftSubtask[]) {
    this.rowsSignal.set(rows);
  }

  /** La fecha límite parte de la fecha del evento, y nunca antes de hoy. */
  deadlineMin(): string {
    const date = this.form.controls.date.value;
    return date > this.today ? date : this.today;
  }

  selectType(type: string): void {
    this.form.controls.type.setValue(type);
  }

  /** Mueve la subtarea redactada a la lista; devuelve si se pudo agregar. */
  addRow(): boolean {
    const { name, targetDate, hours } = this.form.controls.draft.getRawValue();
    const trimmed = name.trim();
    if (!trimmed) {
      this.draftError.set('Escribe el nombre de la subtarea.');
      return false;
    }
    if (!targetDate) {
      this.draftError.set('Falta el plazo de la subtarea.');
      return false;
    }
    if (!hours || hours <= 0) {
      this.draftError.set('Las horas estimadas deben ser mayores a 0.');
      return false;
    }
    this.draftError.set('');
    this.rows = [...this.rows, { name: trimmed, targetDate, estimatedHours: Number(hours) }];
    this.form.controls.draft.reset({ name: '', targetDate: '', hours: 1 });
    return true;
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
  }

  submit(): void {
    if (this.saving() || this.createdEventId()) return;
    this.error.set('');
    this.fieldErrors.set({});
    this.overload.set(null);

    const { name, type, date, time, place, contact, deadline, draft } = this.form.getRawValue();
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors['nombre'] = 'No ingresaste el nombre del evento.';
    }
    if (!type.trim()) {
      errors['tipo'] = 'No ingresaste el tipo de evento.';
    }
    if (!date) {
      errors['fechaHora'] = 'No ingresaste la fecha del evento.';
    } else if (date < this.today) {
      errors['fechaHora'] = 'La fecha del evento no puede ser anterior a hoy.';
    }
    if (deadline && deadline < (date || this.today)) {
      errors['plazoLimite'] = date
        ? 'La fecha límite no puede ser anterior a la fecha del evento.'
        : 'La fecha límite no puede ser anterior a hoy.';
    }
    if (!time) {
      errors['hora'] = 'No ingresaste la hora del evento.';
    }

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      this.error.set('Por favor, corrija los errores en el formulario.');
      return;
    }

    // Una subtarea a medio redactar no se pierde en silencio: se agrega o se avisa qué le falta.
    if (draft.name.trim() && !this.addRow()) {
      return;
    }

    const payload: EventPayload = {
      name: name.trim(),
      type: type.trim(),
      contact: contact.trim(),
      datetime: `${date}T${time}`,
      place: place.trim(),
      deadline
    };

    const subtareas: SubtareaInicialRequestDto[] = this.rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        targetDate: row.targetDate,
        estimatedHours: Number(row.estimatedHours)
      }));

    this.saving.set(true);

    this.eventsService.create(payload, subtareas).subscribe({
      next: (event) => {
        this.saving.set(false);
        this.createdEventId.set(event.id);
      },
      error: (error: AppHttpError) => {
        this.saving.set(false);
        if (error.status === 409 && error.overload) {
          this.overload.set(error.overload);
          this.error.set(
            `Las subtareas iniciales superan tu capacidad diaria por ${this.roundHours(error.overload.exceedsBy)} h. Ajusta las horas o sus fechas e inténtalo de nuevo.`
          );
        } else {
          this.error.set(error.message);
        }
        this.fieldErrors.set(error.fieldErrors ?? {});
      }
    });
  }

  acceptCreated(): void {
    const eventId = this.createdEventId();
    if (!eventId) return;
    this.createdEventId.set(null);
    this.router.navigate(['/evento', eventId]);
  }

  private roundHours(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
