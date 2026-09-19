import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';

import { Subtask, SubtaskStatus } from '../models/subtask.model';
import { SubtaskItemComponent } from './subtask-item.component';

@Component({
  selector: 'app-subtask-column',
  standalone: true,
  imports: [CommonModule, SubtaskItemComponent],
  templateUrl: './subtask-column.component.html'
})
export class SubtaskColumnComponent {
  readonly heading = input.required<string>();
  readonly status = input.required<SubtaskStatus>();
  readonly items = input.required<Subtask[]>();
  readonly emptyMessage = input('Sin gestiones en este grupo.');

  @Output() readonly markDone = new EventEmitter<Subtask>();
  @Output() readonly postpone = new EventEmitter<Subtask>();
  @Output() readonly reschedule = new EventEmitter<Subtask>();
  @Output() readonly edit = new EventEmitter<Subtask>();
  @Output() readonly remove = new EventEmitter<Subtask>();

  readonly dotClass = computed(() => {
    switch (this.status()) {
      case 'DONE':
        return 'bg-success';
      case 'POSTPONED':
        return 'bg-warning';
      default:
        return 'bg-primary';
    }
  });

  readonly countLabel = computed(() => `${this.items().length}`.padStart(2, '0'));
}
