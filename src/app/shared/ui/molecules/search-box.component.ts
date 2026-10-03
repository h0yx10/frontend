import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged } from 'rxjs';

/** Caja de búsqueda con debounce. Emite el término normalizado (trim) en `search`. */
@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './search-box.component.html'
})
export class SearchBoxComponent {
  readonly placeholder = input('Buscar…');
  readonly ariaLabel = input('Buscar');
  readonly value = input('');
  readonly search = output<string>();

  readonly control = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      const external = this.value();
      if (external !== this.control.value) {
        this.control.setValue(external, { emitEvent: false });
      }
    });

    this.control.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((term) => this.search.emit(term.trim()));
  }

  clear(): void {
    this.control.setValue('');
  }
}
