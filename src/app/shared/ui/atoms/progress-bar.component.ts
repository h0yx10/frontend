import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html'
})
export class ProgressBarComponent {
  readonly percentage = input.required<number>();
  readonly label = input('');
  readonly autoTone = input(false);

  readonly clamped = computed(() => Math.min(100, Math.max(0, this.percentage())));

  readonly fillClass = computed(() => {
    if (!this.autoTone()) {
      return 'bg-primary';
    }
    if (this.clamped() >= 100) {
      return 'bg-success';
    }
    if (this.clamped() < 40) {
      return 'bg-danger';
    }
    return 'bg-primary';
  });
}
