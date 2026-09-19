import { Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'danger' | 'success' | 'warning' | 'accent';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html'
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<BadgeTone>('neutral');

  readonly toneClasses = computed(() => {
    switch (this.tone()) {
      case 'danger':
        return 'bg-danger-soft text-danger';
      case 'success':
        return 'bg-success-soft text-success';
      case 'warning':
        return 'bg-warning-soft text-warning';
      case 'accent':
        return 'bg-primary/15 text-accent';
      default:
        return 'bg-surface text-muted';
    }
  });
}
