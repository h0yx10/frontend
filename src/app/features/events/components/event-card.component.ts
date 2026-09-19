import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatIsoDateHuman } from '../../../core/utils/date.util';
import { ProgressBarComponent } from '../../../shared/ui/atoms/progress-bar.component';
import { EventEntity } from '../models/event.model';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ProgressBarComponent],
  templateUrl: './event-card.component.html'
})
export class EventCardComponent {
  readonly event = input.required<EventEntity>();
  readonly formatIsoDateHuman = formatIsoDateHuman;

  readonly eventDate = computed(() => this.event().datetime.slice(0, 10));

  readonly percentageClass = computed(() => {
    const percentage = this.event().progress.percentage;
    if (percentage >= 100) {
      return 'text-success';
    }
    if (percentage < 40) {
      return 'text-danger';
    }
    return 'text-accent';
  });
}
