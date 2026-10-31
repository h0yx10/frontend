import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckButtonComponent } from './check-button.component';

describe('CheckButtonComponent', () => {
  let fixture: ComponentFixture<CheckButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports:[CheckButtonComponent]}).compileComponents();
    fixture = TestBed.createComponent(CheckButtonComponent);
    fixture.componentRef.setInput('label','Marcar hecha: Reservar salón');
    fixture.detectChanges();
  });

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
  }

  it('es una casilla accesible con nombre y estado', () => {
    expect(button().getAttribute('role')).toBe('checkbox');
    expect(button().getAttribute('aria-label')).toBe('Marcar hecha: Reservar salón');
    expect(button().getAttribute('aria-checked')).toBe('false');
    fixture.componentRef.setInput('checked',true);
    fixture.detectChanges();
    expect(button().getAttribute('aria-checked')).toBe('true');
  });

  it('mide 24×24 px como mínimo (WCAG 2.5.8)', () => {
    expect(button().classList).toContain('size-6');
  });

  it('avisa al pulsarla', () => {
    let toggled = 0;
    fixture.componentInstance.toggled.subscribe(() => toggled++);
    button().click();
    expect(toggled).toBe(1);
  });
});
