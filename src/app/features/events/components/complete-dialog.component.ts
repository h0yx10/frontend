import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { NOTE_MAX_LENGTH, Subtask } from '../models/subtask.model';
import { SubtasksService } from '../services/subtasks.service';

/**
 * Registro de ejecución con nota (US-09): marca la gestión como hecha y guarda qué se hizo.
 * Sirve también para cerrar gestiones pospuestas, que no tienen el check rápido.
 */
@Component({
  selector: 'app-complete-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './complete-dialog.component.html'
})
export class CompleteDialogComponent {
  private readonly subtasksService = inject(SubtasksService);

  readonly subtask = input<Subtask | null>(null);

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly changed = new EventEmitter<Subtask>();

  readonly noteMaxLength = NOTE_MAX_LENGTH;
  readonly saving = signal(false);
  readonly error = signal('');
  note = '';

  constructor() {
    effect(
      () => {
        if (this.subtask()) {
          this.note = '';
          this.error.set('');
        }
      },
      { allowSignalWrites: true }
    );
  }

  confirm(): void {
    const subtask = this.subtask();
    if (!subtask || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.subtasksService
      // Sin nota se envía null: el backend conserva la anterior (p. ej. el motivo del aplazamiento).
      .execute(subtask.id, { status: 'DONE', note: this.note.trim() || null })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.changed.emit(updated);
          this.closed.emit();
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }
}
