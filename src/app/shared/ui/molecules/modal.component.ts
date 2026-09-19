import { A11yModule } from '@angular/cdk/a11y';
import { Component, EventEmitter, HostListener, input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [A11yModule, MatIconModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent {
  readonly titleId = input.required<string>();
  readonly heading = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  @Output() readonly closed = new EventEmitter<void>();

  @HostListener('keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.closed.emit();
  }
}
