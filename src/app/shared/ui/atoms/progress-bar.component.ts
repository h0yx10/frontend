import { Component, computed, input } from '@angular/core';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html'
})
export class ProgressBarComponent {
  readonly percentage = input.required<number>();
  readonly label = input('');
  readonly ariaValueText = input('');
  /** Color fijo del relleno; se ignora con `autoTone`. */
  readonly tone = input<ProgressTone>('primary');
  readonly size = input<'sm' | 'md'>('md');
  /** El relleno pasa a verde al completarse y a rojo por debajo del 40 %. */
  readonly autoTone = input(false);

  readonly clamped = computed(() => Math.min(100, Math.max(0, this.percentage())));

  readonly fillClass = computed(() => {
    if (!this.autoTone()) {
      return TONE_CLASSES[this.tone()];
    }
    if (this.clamped() >= 100) {
      return TONE_CLASSES.success;
    }
    if (this.clamped() < 40) {
      return TONE_CLASSES.danger;
    }
    return TONE_CLASSES.primary;
  });
}

const TONE_CLASSES: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger'
};
