import { CommonModule } from '@angular/common';
import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { DateBucket, formatIsoDateShort } from '../../../core/utils/date.util';
import { CheckButtonComponent } from '../../../shared/ui/atoms/check-button.component';
import { BadgeTone, StatusBadgeComponent } from '../../../shared/ui/atoms/status-badge.component';
import { Subtask } from '../../events/models/subtask.model';

@Component({
  selector: 'app-today-item',
  standalone: true,
  imports: [CommonModule, MatIconModule, CheckButtonComponent, StatusBadgeComponent],
  templateUrl: './today-item.component.html'
})
export class TodayItemComponent {
  readonly subtask = input.required<Subtask>();
  readonly bucket = input.required<DateBucket>();

  @Output() readonly markDone = new EventEmitter<Subtask>();
  @Output() readonly postpone = new EventEmitter<Subtask>();
  @Output() readonly reschedule = new EventEmitter<Subtask>();

  /** Franja lateral que distingue las vencidas del resto sin competir con el contenido. */
  readonly accentClass = computed(() => (this.bucket() === 'OVERDUE' ? 'border-l-2 border-l-danger' : ''));

  readonly dateBadge = computed<{ label: string; tone: BadgeTone }>(() => {
    switch (this.bucket()) {
      case 'OVERDUE':
        return { label: `Venció ${formatIsoDateShort(this.subtask().targetDate)}`, tone: 'danger' };
      case 'TODAY':
        return { label: 'Vence hoy', tone: 'accent' };
      default:
        return { label: `Vence ${formatIsoDateShort(this.subtask().targetDate)}`, tone: 'neutral' };
    }
  });
}
