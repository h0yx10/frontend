import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { classifyByDate, formatDateOnlyShort, formatIsoDateShort } from '../../../core/utils/date.util';
import { CheckButtonComponent } from '../../../shared/ui/atoms/check-button.component';
import { BadgeTone, StatusBadgeComponent } from '../../../shared/ui/atoms/status-badge.component';
import { Subtask } from '../models/subtask.model';

@Component({
  selector: 'app-subtask-item',
  standalone: true,
  imports: [MatIconModule, CheckButtonComponent, StatusBadgeComponent],
  templateUrl: './subtask-item.component.html',
  styles: `:host { display: block; min-width: 0; }`
})
export class SubtaskItemComponent {
  readonly subtask = input.required<Subtask>();

  @Output() readonly markDone = new EventEmitter<Subtask>();
  @Output() readonly postpone = new EventEmitter<Subtask>();
  @Output() readonly reschedule = new EventEmitter<Subtask>();
  @Output() readonly edit = new EventEmitter<Subtask>();
  @Output() readonly remove = new EventEmitter<Subtask>();

  readonly formatIsoDateShort = formatIsoDateShort;

  readonly borderClass = computed(() => {
    switch (this.subtask().status) {
      case 'DONE':
        return 'border-l-2 border-l-success';
      case 'POSTPONED':
        return 'border-l-2 border-l-warning';
      default:
        return 'border-l-2 border-l-accent';
    }
  });

  /** Estado y plazo en una sola etiqueta: es lo primero que se busca al revisar una gestión. */
  readonly badge = computed<{ label: string; tone: BadgeTone }>(() => {
    const subtask = this.subtask();
    const date = formatIsoDateShort(subtask.targetDate);
    if (subtask.status === 'DONE') {
      return { label: subtask.doneAt ? `Hecha ${formatDateOnlyShort(subtask.doneAt)}` : 'Hecha', tone: 'success' };
    }
    if (subtask.status === 'POSTPONED') {
      return { label: 'Pospuesta', tone: 'warning' };
    }
    switch (classifyByDate(subtask.targetDate)) {
      case 'OVERDUE':
        return { label: `Venció ${date}`, tone: 'danger' };
      case 'TODAY':
        return { label: 'Vence hoy', tone: 'accent' };
      default:
        return { label: `Vence ${date}`, tone: 'neutral' };
    }
  });
}
