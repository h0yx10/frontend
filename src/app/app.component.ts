import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Raíz: el login es una ruta de pantalla completa y las rutas privadas viven dentro de `ShellLayoutComponent`. */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent {}
