import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatDateTimeHuman } from '../../core/utils/date.util';
import { EmptyStateComponent } from '../../shared/ui/molecules/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/molecules/error-state.component';
import { ProgressBarComponent } from '../../shared/ui/atoms/progress-bar.component';
import { EventsStore } from './store/events.store';

/** Vista "Actividades": lista todas las actividades (eventos) consumiendo GET /api/events. */
@Component({
  selector: 'app-activities-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, ErrorStateComponent, ProgressBarComponent],
  providers: [EventsStore],
  templateUrl: './activities-page.component.html'
})
export class ActivitiesPageComponent {
  readonly store = inject(EventsStore);
  readonly formatDateTimeHuman = formatDateTimeHuman;

  constructor() {
    this.store.load();
  }
}
