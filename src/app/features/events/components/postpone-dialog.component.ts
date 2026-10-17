import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ToastService } from '../../../core/feedback/toast.service';
import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { NOTE_MAX_LENGTH, Subtask } from '../models/subtask.model';
import { SubtasksService } from '../services/subtasks.service';

@Component({
  selector: 'app-postpone-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './postpone-dialog.component.html'
})
export class PostponeDialogComponent {
  private readonly subtasksService = inject(SubtasksService);
  private readonly toasts = inject(ToastService);

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
    if (!subtask) {
      return;
    }

    const note = this.note.trim() || null;
    this.saving.set(true);
    this.error.set('');
    this.subtasksService
      .execute(subtask.id, { status: 'POSTPONED', note })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.toasts.show(`«${subtask.name}» quedó pospuesta${note ? ' con su motivo anotado' : ''}.`, 'info');
          this.changed.emit(updated);
          this.closed.emit();
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }
}
