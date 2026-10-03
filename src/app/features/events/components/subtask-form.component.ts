import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { InfoDialogComponent } from '../../../shared/ui/molecules/info-dialog.component';
import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { Subtask } from '../models/subtask.model';
import { EventDetailStore } from '../store/event-detail.store';

@Component({
  selector: 'app-subtask-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, InfoDialogComponent],
  templateUrl: './subtask-form.component.html'
})
export class SubtaskFormComponent {
  readonly store = inject(EventDetailStore);

  readonly open = input(false);
  readonly editing = input<Subtask | null>(null);

  readonly successInfo = signal<{ heading: string; message: string } | null>(null);

  @Output() readonly closed = new EventEmitter<void>();

  name = '';
  description = '';
  targetDate = '';
  estimatedHours: number | null = null;

  constructor() {
    effect(
      () => {
        if (this.open()) {
          const editing = this.editing();
          this.name = editing?.name ?? '';
          this.description = editing?.description ?? '';
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

  private validate(): boolean {
    const errors: Record<string, string> = {};

    if (!this.name.trim()) {
      errors['nombre'] = 'No ingresaste el título de la subtarea.';
    }
    if (!this.targetDate) {
      errors['fechaObjetivo'] = 'No seleccionaste la fecha objetivo.';
    }
    if (!this.estimatedHours || this.estimatedHours <= 0) {
      errors['horasEstimadas'] = 'No ingresaste las horas estimadas.';
    }

    this.store.subtaskFieldErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  submit(): void {
    if (!this.validate()) {
      return;
    }

    const payload = {
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      targetDate: this.targetDate,
      estimatedHours: Number(this.estimatedHours)
    };

    const editing = this.editing();
    if (editing) {
      this.store.updateSubtask(editing.id, payload, () => {
        this.closed.emit();
        this.successInfo.set({
          heading: 'Subtarea actualizada',
          message: 'La subtarea fue actualizada correctamente.'
        });
      });
    } else {
      this.store.addSubtask(payload, () => {
        this.closed.emit();
        this.successInfo.set({
          heading: 'Subtarea creada',
          message: 'La subtarea fue creada correctamente.'
        });
      });
    }
  }

  dismissSuccess(): void {
    this.successInfo.set(null);
  }
}
