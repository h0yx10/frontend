import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import { addDaysIso, afterEventDayWarning, formatIsoDateHuman } from '../../../core/utils/date.util';
import { ModalComponent } from '../../../shared/ui/molecules/modal.component';
import { OverloadCheckResult } from '../models/conflict.model';
import { Subtask } from '../models/subtask.model';
import { ConflictsService } from '../services/conflicts.service';
import { SubtasksService } from '../services/subtasks.service';

interface DaySuggestion {
  date: string;
  result: OverloadCheckResult;
}

/**
 * Reprogramación (US-06) con detección y resolución de sobrecarga (US-07/US-08).
 * Se usa desde /evento/:id y desde /hoy, así que no depende de ningún store
 * concreto: habla directo con SubtasksService y avisa al padre con `changed`.
 */
@Component({
  selector: 'app-reschedule-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './reschedule-dialog.component.html'
})
export class RescheduleDialogComponent {
  private readonly conflicts = inject(ConflictsService);
  private readonly subtasksService = inject(SubtasksService);

  readonly subtask = input<Subtask | null>(null);
  readonly initialConflict = input<OverloadCheckResult | null>(null);
  /** Día del evento (YYYY-MM-DD): una fecha posterior se permite, pero se advierte. */
  readonly maxDate = input<string | null>(null);

  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly changed = new EventEmitter<Subtask>();

  readonly formatIsoDateHuman = formatIsoDateHuman;

  targetDate = '';
  readonly checking = signal(false);
  readonly saving = signal(false);
  readonly conflict = signal<OverloadCheckResult | null>(null);
  readonly suggestions = signal<DaySuggestion[]>([]);
  readonly reducedHours = signal(1);
  readonly showReduceForm = signal(false);
  readonly error = signal('');
  readonly roundHours = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

  constructor() {
    effect(
      () => {
        const subtask = this.subtask();
        if (subtask) {
          this.targetDate = subtask.targetDate;
          this.reducedHours.set(subtask.estimatedHours);
          this.resetConflictState();
          const conflict = this.initialConflict();
          if (conflict) {
            this.conflict.set(conflict);
            this.loadSuggestions(subtask);
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  private resetConflictState(): void {
    this.conflict.set(null);
    this.suggestions.set([]);
    this.showReduceForm.set(false);
    this.error.set('');
  }

  isAfterEvent(date: string): boolean {
    return !!afterEventDayWarning(date, this.maxDate());
  }

  /** Aviso, no bloqueo: si el evento se aplazó, la gestión puede necesitar esa fecha. */
  get dateWarning(): string {
    return afterEventDayWarning(this.targetDate, this.maxDate());
  }

  onDateChange(): void {
    this.resetConflictState();
  }

  chooseAnotherDay(): void {
    this.resetConflictState();
  }

  checkAndSave(): void {
    const subtask = this.subtask();
    if (!subtask || !this.targetDate) {
      return;
    }

    this.checking.set(true);
    this.error.set('');

    this.conflicts
      .checkOverload(subtask.id, {
        targetDate: this.targetDate,
        estimatedHours: subtask.estimatedHours
      })
      .subscribe({
        next: (result) => {
          this.checking.set(false);
          if (!result.exceeds) {
            this.applyReschedule(this.targetDate);
            return;
          }
          this.conflict.set(result);
          this.loadSuggestions(subtask);
        },
        error: (error: Error) => {
          this.checking.set(false);
          this.error.set(error.message);
        }
      });
  }

  private loadSuggestions(subtask: Subtask): void {
    const candidateDates = [1, 2, 3].map((offset) => addDaysIso(this.targetDate, offset));

    forkJoin(
      candidateDates.map((date) =>
        this.conflicts.checkOverload(subtask.id, {
          targetDate: date,
          estimatedHours: subtask.estimatedHours
        })
      )
    ).subscribe({
      next: (results) =>
        this.suggestions.set(candidateDates.map((date, index) => ({ date, result: results[index] }))),
      // Las sugerencias son una ayuda: si fallan, el resto de opciones del diálogo sigue disponible.
      error: () => this.suggestions.set([])
    });
  }

  pickSuggestion(date: string): void {
    this.targetDate = date;
    this.resetConflictState();
  }

  private applyReschedule(date: string): void {
    const subtask = this.subtask();
    if (!subtask) {
      return;
    }
    this.saving.set(true);
    this.subtasksService
      .update(subtask.id, { targetDate: date })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.changed.emit(updated);
          this.closed.emit();
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }

  toggleReduceForm(): void {
    this.showReduceForm.set(!this.showReduceForm());
  }

  /**
   * Horas con las que la gestión deja de exceder el límite: sus horas originales menos el exceso.
   * Se parte de la subtarea, no de `reducedHours()`, que es el valor que el usuario está escribiendo.
   */
  get maxReducibleHours(): number {
    const conflict = this.conflict();
    const subtask = this.subtask();
    if (!conflict || !subtask) {
      return 0;
    }
    return Math.max(0.5, +(subtask.estimatedHours - conflict.exceedsBy).toFixed(2));
  }

  confirmReduceHours(): void {
    const subtask = this.subtask();
    if (!subtask) {
      return;
    }
    this.saving.set(true);
    this.subtasksService
      .update(subtask.id, { estimatedHours: this.reducedHours(), targetDate: this.targetDate })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.changed.emit(updated);
          this.closed.emit();
        },
        error: (error: Error) => this.error.set(error.message)
      });
  }

  openPostpone(): void {
    const subtask = this.subtask();
    if (!subtask) {
      return;
    }
    this.saving.set(true);
    this.subtasksService
      .execute(subtask.id, { status: 'POSTPONED', note: null })
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
