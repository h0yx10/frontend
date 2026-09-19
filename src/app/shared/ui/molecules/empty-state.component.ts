import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  readonly title = input('Sin resultados');
  readonly message = input('Ajusta los filtros o crea un nuevo elemento.');
  readonly icon = input('inbox');
}
