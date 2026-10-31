import { ComponentFixture, TestBed } from '@angular/core/testing';

import { todayIsoDate } from '../../../core/utils/date.util';
import { EventPayload } from '../models/event.model';
import { EventFormComponent } from './event-form.component';

const event: EventPayload = {
  name: 'Boda Camila & Andrés', type: 'Boda', contact: '3001234567',
  datetime: '2020-06-01T18:30', place: 'Club Campestre', deadline: '2020-06-01'
};

describe('EventFormComponent (edición)', () => {
  let fixture: ComponentFixture<EventFormComponent>;
  let component: EventFormComponent;
  let saved: EventPayload[];

  beforeEach(() => {
    fixture = TestBed.createComponent(EventFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('initial', event);
    saved = [];
    component.save.subscribe((payload) => saved.push(payload));
    fixture.detectChanges();
  });

  it('muestra los mismos campos que Nuevo evento, precargados', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(component.form.getRawValue()).toEqual({
      name: event.name, type: 'Boda', date: '2020-06-01', time: '18:30',
      place: 'Club Campestre', contact: '3001234567', deadline: '2020-06-01'
    });
    for (const id of ['event-name', 'event-date', 'event-time', 'event-place', 'event-contact', 'event-deadline']) {
      expect(element.querySelector(`#${id}`)).withContext(id).not.toBeNull();
    }
    expect(element.querySelector('[role="radio"][aria-checked="true"]')?.textContent?.trim()).toBe('Boda');
  });

  it('permite guardar un evento pasado sin cambiar su fecha', () => {
    component.form.patchValue({ name: 'Boda renombrada' });
    component.submit();
    expect(saved).toEqual([{ ...event, name: 'Boda renombrada' }]);
  });

  it('una fecha de inicio nueva no puede ser anterior a hoy', () => {
    component.form.patchValue({ date: '2020-06-02', deadline: '' });
    component.submit();
    expect(saved).toEqual([]);
    expect(component.errors()['fechaHora']).toContain('anterior a hoy');
  });

  it('la fecha límite no puede ser anterior a la fecha de inicio', () => {
    const today = todayIsoDate();
    component.form.patchValue({ date: today, deadline: '2020-01-01' });
    component.submit();
    expect(saved).toEqual([]);
    expect(component.errors()['plazoLimite']).toContain('anterior a la fecha de inicio');
  });

  it('cambia el tipo con los botones', () => {
    const social = Array.from(fixture.nativeElement.querySelectorAll('[role="radio"]') as NodeListOf<HTMLButtonElement>)
      .find((button) => button.textContent?.trim() === 'Social')!;
    social.click();
    expect(component.form.controls.type.value).toBe('Social');
  });
});
