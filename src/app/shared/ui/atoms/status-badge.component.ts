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
        return 'bg-danger-warm/10 text-danger-warm';
      case 'success':
        return 'bg-success-muted/10 text-success-muted';
      case 'warning':
        return 'bg-warning-warm/10 text-warning-warm';
      case 'accent':
        return 'bg-primary/15 text-accent';
      default:
        return 'bg-surface text-muted';
    }
  });
}
