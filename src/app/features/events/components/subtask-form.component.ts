import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { Subtask } from '../models/subtask.model';
import { EventDetailStore } from '../store/event-detail.store';

@Component({
  selector: 'app-subtask-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './subtask-form.component.html'
})
export class SubtaskFormComponent {
  readonly store = inject(EventDetailStore);

  readonly open = input(false);
  readonly editing = input<Subtask | null>(null);

  @Output() readonly closed = new EventEmitter<void>();

  name = '';
  targetDate = '';
  estimatedHours: number | null = null;

  constructor() {
    effect(
      () => {
        if (this.open()) {
          const editing = this.editing();
          this.name = editing?.name ?? '';
          this.targetDate = editing?.targetDate ?? '';
          this.estimatedHours = editing?.estimatedHours ?? null;
          this.store.subtaskFieldErrors.set({});
        }
      },
      { allowSignalWrites: true }
    );
  }

  get heading(): string {
    return this.editing() ? 'Editar subtarea' : 'Agregar subtarea logística';
  }

  submit(): void {
    const payload = {
      name: this.name.trim(),
      targetDate: this.targetDate,
      estimatedHours: Number(this.estimatedHours)
    };

    const editing = this.editing();
    if (editing) {
      this.store.updateSubtask(editing.id, payload, () => this.closed.emit());
    } else {
      this.store.addSubtask(payload, () => this.closed.emit());
    }
  }
}
