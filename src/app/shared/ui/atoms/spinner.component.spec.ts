import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SpinnerComponent } from './spinner.component';

@Component({
  standalone: true,
  imports: [SpinnerComponent],
  template: `<app-spinner [size]="size" [label]="label" />`
})
class HostComponent {
  size = 18;
  label = 'Cargando eventos';
}

describe('SpinnerComponent', () => {
  function render(label: string) {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.label = label;
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('app-spinner') as HTMLElement;
  }

  it('dibuja ocho barras con el tamaño indicado', () => {
    const spinner = render('Cargando eventos');
    expect(spinner.querySelectorAll('i').length).toBe(8);
    expect(spinner.style.getPropertyValue('--s')).toBe('18px');
  });

  it('se anuncia como estado de carga cuando tiene etiqueta', () => {
    const spinner = render('Cargando eventos');
    expect(spinner.getAttribute('role')).toBe('status');
    expect(spinner.getAttribute('aria-label')).toBe('Cargando eventos');
    expect(spinner.getAttribute('aria-hidden')).toBeNull();
  });

  it('queda oculto para lectores de pantalla si ya hay un texto visible', () => {
    const spinner = render('');
    expect(spinner.getAttribute('role')).toBeNull();
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
  });
});
