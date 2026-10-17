import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { afterEventDayWarning } from '../../../core/utils/date.util';
import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { OverloadCheckResult, planReduction, ReductionPlan } from '../models/conflict.model';

@Component({
  selector: 'app-overload-resolution-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './overload-resolution-dialog.component.html'
})
export class OverloadResolutionDialogComponent {
  readonly conflict = input.required<OverloadCheckResult>();
  readonly initialDate = input.required<string>();
  readonly initialHours = input.required<number>();
  /** Día del evento: mover la subtarea más allá se permite, pero se advierte. */
  readonly eventDay = input<string | null>(null);
  readonly busy = input(false);

  @Output() readonly move = new EventEmitter<string>();
  @Output() readonly reduce = new EventEmitter<number>();
  @Output() readonly cancelled = new EventEmitter<void>();

  readonly action = signal<'choose-date' | 'reduce-hours' | null>(null);
  date = '';
  hours: number | null = null;

  constructor() {
    effect(
      () => {
        this.conflict();
        this.date = this.initialDate();
        this.hours = this.initialHours();
        this.action.set(null);
      },
      { allowSignalWrites: true }
    );
  }

  chooseMove(): void {
    this.date = this.initialDate();
    this.action.set('choose-date');
  }

  /** El campo se abre con el valor que resuelve el conflicto: el usuario lo confirma o lo ajusta. */
  chooseReduce(): void {
    if (!this.reduction.possible) {
      return;
    }
    this.hours = this.reduction.suggested;
    this.action.set('reduce-hours');
  }

  get reduction(): ReductionPlan {
    return planReduction(this.initialHours(), this.conflict().exceedsBy);
  }

  get dateWarning(): string {
    return afterEventDayWarning(this.date, this.eventDay());
  }

  confirmMove(): void {
    if (this.date) {
      this.move.emit(this.date);
    }
  }

  /** Horas con las que la gestión deja de exceder: las que tenía menos el exceso. */
  get maxHours(): number {
    return this.reduction.max;
  }

  get reduceError(): string {
    if (!this.reduction.possible) {
      return 'Reducir no alcanza: mueve la gestión a otro día.';
    }
    const hours = Number(this.hours);
    if (!Number.isFinite(hours) || hours <= 0) {
      return 'Indica horas mayores a 0.';
    }
    if (hours > this.maxHours) {
      return `Con ${hours} h aún superas el límite: máximo ${this.maxHours} h.`;
    }
    return '';
  }

  confirmReduce(): void {
    if (!this.reduceError) {
      this.reduce.emit(Number(this.hours));
    }
  }

  closeAction(): void {
    this.action.set(null);
  }

  roundHours(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
