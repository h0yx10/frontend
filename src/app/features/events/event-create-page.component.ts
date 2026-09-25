import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { AppHttpError } from '../../core/interceptors/http-error.interceptor';
import { EVENT_TYPE_SUGGESTIONS, EventPayload, SubtareaInicialRequestDto } from './models/event.model';
import { EventsService } from './services/events.service';

interface DraftSubtask {
  name: string;
  targetDate: string;
  estimatedHours: number | null;
}

@Component({
  selector: 'app-event-create-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterLink],
  templateUrl: './event-create-page.component.html'
})
export class EventCreatePageComponent {
  private readonly eventsService = inject(EventsService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly typeSuggestions = EVENT_TYPE_SUGGESTIONS;
  readonly saving = signal(false);
  readonly error = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly rowErrors = signal<Record<number, string>>({});

  name = '';
  type = '';
  contact = '';
  datetime = '';
  place = '';

  rows: DraftSubtask[] = [];

  addRow(): void {
    this.rows = [...this.rows, { name: '', targetDate: '', estimatedHours: null }];
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
  }

  private validateRows(): boolean {
    const errors: Record<number, string> = {};

    this.rows.forEach((row, index) => {
      if (!row.name.trim()) {
        return;
      }
      if (!row.targetDate) {
        errors[index] = 'Falta el plazo.';
      } else if (!row.estimatedHours || row.estimatedHours <= 0) {
        errors[index] = 'Las horas estimadas deben ser mayores a 0.';
      }
    });

    this.rowErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  submit(): void {
    this.saving.set(true);
    this.error.set('');
    this.fieldErrors.set({});
    
    const errors: Record<string, string> = {};

    if (!this.name.trim()) {
      errors['name'] = 'El nombre es obligatorio.';
    }
    if (!this.type.trim()) {
      errors['type'] = 'El tipo es obligatorio.';
    }
    if (!this.datetime) {
      errors['datetime'] = 'La fecha y hora son obligatorias.';
    }

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      this.error.set('Por favor, corrija los errores en el formulario.');
      this.saving.set(false);
      return;
    }

    if (!this.validateRows()) {
      this.saving.set(false);
      return;
    }

    const payload: EventPayload = {
      name: this.name.trim(),
      type: this.type.trim(),
      contact: this.contact.trim(),
      datetime: this.datetime,
      place: this.place.trim()
    };

    const subtareas: SubtareaInicialRequestDto[] = this.rows
      .filter((row) => row.name.trim())
      .map((row) => ({
        nombre: row.name.trim(),
        fechaObjetivo: row.targetDate,
        horasEstimadas: Number(row.estimatedHours)
      }));

    this.eventsService.create(payload, subtareas).subscribe({
      next: (event) => {
        this.saving.set(false);
        this.snackBar.open('Actividad creada correctamente', 'Cerrar', {
          duration: 4000,
          panelClass: 'app-snackbar-success'
        });
        this.router.navigate(['/evento', event.id]);
      },
      error: (error: AppHttpError) => {
        this.saving.set(false);
        this.error.set(error.message);
        this.fieldErrors.set(error.fieldErrors ?? {});
      }
    });
  }
}
