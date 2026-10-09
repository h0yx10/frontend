import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { OverloadCheckResult } from '../models/conflict.model';

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

  chooseReduce(): void {
    this.hours = this.initialHours();
    this.action.set('reduce-hours');
  }

  confirmMove(): void {
    if (this.date) {
      this.move.emit(this.date);
    }
  }

  confirmReduce(): void {
    const hours = Number(this.hours);
    if (Number.isFinite(hours) && hours > 0) {
      this.reduce.emit(hours);
    }
  }

  closeAction(): void {
    this.action.set(null);
  }

  roundHours(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
