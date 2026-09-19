import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';

import { DateBucket, formatIsoDateShort } from '../../../core/utils/date.util';
import { BadgeTone, StatusBadgeComponent } from '../../../shared/ui/atoms/status-badge.component';
import { Subtask } from '../../events/models/subtask.model';

@Component({
  selector: 'app-today-item',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './today-item.component.html'
})
export class TodayItemComponent {
  readonly subtask = input.required<Subtask>();
  readonly bucket = input.required<DateBucket>();

  @Output() readonly markDone = new EventEmitter<Subtask>();
  @Output() readonly postpone = new EventEmitter<Subtask>();
  @Output() readonly reschedule = new EventEmitter<Subtask>();

  readonly borderClass = computed(() => {
    switch (this.bucket()) {
      case 'OVERDUE':
        return 'border-l-danger';
      case 'TODAY':
        return 'border-l-primary';
      default:
        return 'border-l-border';
    }
  });

  readonly dateBadge = computed<{ label: string; tone: BadgeTone }>(() => {
    switch (this.bucket()) {
      case 'OVERDUE':
        return { label: `Venció ${formatIsoDateShort(this.subtask().targetDate)}`, tone: 'danger' };
      case 'TODAY':
        return { label: 'Plazo hoy', tone: 'accent' };
      default:
        return { label: `Plazo ${formatIsoDateShort(this.subtask().targetDate)}`, tone: 'neutral' };
    }
  });
}
