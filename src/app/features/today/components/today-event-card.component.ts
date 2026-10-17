import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DateBucket, formatDateTimeShort } from '../../../core/utils/date.util';
import { Subtask } from '../../events/models/subtask.model';
import { TodayEventGroup } from '../models/today.model';
import { TodayItemComponent } from './today-item.component';

/** Un evento dentro de una columna del tablero, con sus gestiones del grupo. */
@Component({
  selector: 'app-today-event-card',
  standalone: true,
  imports: [RouterLink, TodayItemComponent],
  templateUrl: './today-event-card.component.html'
})
export class TodayEventCardComponent {
  readonly group = input.required<TodayEventGroup>();
  readonly bucket = input.required<DateBucket>();

  @Output() readonly markDone = new EventEmitter<Subtask>();
  @Output() readonly postpone = new EventEmitter<Subtask>();
  @Output() readonly reschedule = new EventEmitter<Subtask>();

  readonly when = computed(() => {
    const event = this.group().event;
    return event ? formatDateTimeShort(event.datetime) : '';
  });

  readonly summary = computed(() => {
    const count = this.group().subtasks.length;
    const plural = count === 1 ? '' : 's';
    switch (this.bucket()) {
      case 'OVERDUE':
        return `${count} subtarea${plural} vencida${plural}`;
      case 'TODAY':
        return `${count} subtarea${plural} pendiente${plural}`;
      default:
        return `${count} subtarea${plural} próxima${plural}`;
    }
  });

  readonly dotClass = computed(() => {
    switch (this.bucket()) {
      case 'OVERDUE':
        return 'bg-danger';
      case 'TODAY':
        return 'bg-warning';
      default:
        return 'bg-muted';
    }
  });

  readonly summaryClass = computed(() => {
    switch (this.bucket()) {
      case 'OVERDUE':
        return 'text-danger';
      case 'TODAY':
        return 'text-warning';
      default:
        return 'text-muted';
    }
  });
}
