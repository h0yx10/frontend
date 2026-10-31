import { Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, filter, map } from 'rxjs';

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

    // Se compara con el valor que tiene la página, no con el último emitido: si la página limpia
    // la búsqueda desde fuera (p. ej. "Limpiar filtros"), volver a escribir el mismo término debe aplicarse.
    this.control.valueChanges
      .pipe(
        debounceTime(250),
        map((term) => term.trim()),
        filter((term) => term !== this.value().trim()),
        takeUntilDestroyed()
      )
      .subscribe((term) => this.search.emit(term));
  }

  clear(): void {
    this.control.setValue('');
  }
}
