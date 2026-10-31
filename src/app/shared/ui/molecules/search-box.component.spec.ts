import { Component, signal } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { SearchBoxComponent } from './search-box.component';

@Component({
  standalone: true,
  imports: [SearchBoxComponent],
  template: `<app-search-box [value]="query()" (search)="onSearch($event)" />`
})
class HostComponent {
  readonly query = signal('');
  readonly emitted: string[] = [];
  onSearch(term: string): void {
    this.emitted.push(term);
    this.query.set(term);
  }
}

describe('SearchBoxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let input: HTMLInputElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input');
  });

  function type(value: string) {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    tick(250);
    fixture.detectChanges();
  }

  it('emite el término recortado tras la pausa de escritura', fakeAsync(() => {
    type('  boda ');
    expect(host.emitted).toEqual(['boda']);
  }));

  it('vuelve a aplicar el mismo término si la página limpió la búsqueda desde fuera', fakeAsync(() => {
    type('boda');
    host.query.set(''); // p. ej. "Limpiar filtros"
    fixture.detectChanges();
    expect(input.value).toBe('');
    type('boda');
    expect(host.emitted).toEqual(['boda', 'boda']);
  }));

  it('no repite la búsqueda si el término no cambió', fakeAsync(() => {
    type('boda');
    type('boda ');
    expect(host.emitted).toEqual(['boda']);
  }));

  it('el botón de limpiar vacía la búsqueda', fakeAsync(() => {
    type('boda');
    fixture.nativeElement.querySelector('button[aria-label="Limpiar búsqueda"]').click();
    tick(250);
    expect(host.emitted).toEqual(['boda', '']);
  }));
});
