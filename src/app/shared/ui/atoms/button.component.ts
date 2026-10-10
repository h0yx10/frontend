import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { SpinnerComponent } from './spinner.component';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [MatButtonModule, SpinnerComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly appearance = input<'default' | 'orbit'>('default');
}
