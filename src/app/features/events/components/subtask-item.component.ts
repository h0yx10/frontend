import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { formatDateOnlyShort, formatIsoDateHuman } from '../../../core/utils/date.util';
import { Subtask } from '../models/subtask.model';

@Component({
  selector: 'app-subtask-item',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './subtask-item.component.html'
})
export class SubtaskItemComponent {
  readonly subtask = input.required<Subtask>();

  @Output() readonly markDone = new EventEmitter<Subtask>();
  @Output() readonly postpone = new EventEmitter<Subtask>();
  @Output() readonly reschedule = new EventEmitter<Subtask>();
  @Output() readonly edit = new EventEmitter<Subtask>();
  @Output() readonly remove = new EventEmitter<Subtask>();

  readonly formatIsoDateHuman = formatIsoDateHuman;
  readonly formatDateOnlyShort = formatDateOnlyShort;

  readonly borderClass = computed(() => {
    switch (this.subtask().status) {
      case 'DONE':
        return 'border-l-2 border-l-success-muted';
      case 'POSTPONED':
        return 'border-l-2 border-l-warning-warm';
      default:
        return 'border-l-2 border-l-accent';
    }
  });
}
