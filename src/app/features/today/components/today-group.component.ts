import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';

import { DateBucket } from '../../../core/utils/date.util';
import { Subtask } from '../../events/models/subtask.model';
import { TodayItemComponent } from './today-item.component';

@Component({
  selector: 'app-today-group',
  standalone: true,
  imports: [CommonModule, TodayItemComponent],
  templateUrl: './today-group.component.html'
})
export class TodayGroupComponent {
  readonly heading = input.required<string>();
  readonly bucket = input.required<DateBucket>();
  readonly items = input.required<Subtask[]>();

  @Output() readonly markDone = new EventEmitter<Subtask>();
  @Output() readonly postpone = new EventEmitter<Subtask>();
  @Output() readonly reschedule = new EventEmitter<Subtask>();

  readonly dotClass = computed(() => {
    switch (this.bucket()) {
      case 'OVERDUE':
        return 'bg-danger';
      case 'TODAY':
        return 'bg-primary';
      default:
        return 'bg-muted';
    }
  });

  readonly headingClass = computed(() => (this.bucket() === 'OVERDUE' ? 'text-danger' : 'text-ink'));

  readonly countLabel = computed(() => `${this.items().length}`.padStart(2, '0'));
}
