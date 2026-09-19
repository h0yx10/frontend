import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { Subtask } from '../models/subtask.model';
import { SubtasksService } from '../services/subtasks.service';

@Component({
  selector: 'app-postpone-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './postpone-dialog.component.html'
})
export class PostponeDialogComponent {
  private readonly subtasksService = inject(SubtasksService);

  readonly subtask = input<Subtask | null>(null);

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly changed = new EventEmitter<Subtask>();

  readonly saving = signal(false);
  note = '';

  constructor() {
    effect(() => {
      if (this.subtask()) {
        this.note = '';
      }
    });
  }

  confirm(): void {
    const subtask = this.subtask();
    if (!subtask) {
      return;
    }

    this.saving.set(true);
    this.subtasksService
      .execute(subtask.id, { status: 'POSTPONED', note: this.note.trim() || null })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe((updated) => {
        this.changed.emit(updated);
        this.closed.emit();
      });
  }
}
