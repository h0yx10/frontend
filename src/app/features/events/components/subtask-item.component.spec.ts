import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { Subtask, SubtaskStatus } from '../models/subtask.model';
import { SubtaskItemComponent } from './subtask-item.component';

const base: Subtask = {
  id: 's1', eventId: 'e1', eventName: '', name: 'Confirmar catering', description: null,
  targetDate: '2030-01-01', estimatedHours: 1, status: 'PENDING', note: null, doneAt: null, createdAt: '2026-01-01'
};

describe('SubtaskItemComponent', () => {
  let fixture: ComponentFixture<SubtaskItemComponent>;
  let done: Subtask[];
  let reopened: Subtask[];

  function render(status: SubtaskStatus) {
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
    fixture = TestBed.createComponent(SubtaskItemComponent);
    fixture.componentRef.setInput('subtask', { ...base, status, doneAt: status === 'DONE' ? '2030-01-01T10:00:00' : null });
    done = [];
    reopened = [];
    fixture.componentInstance.markDone.subscribe((s) => done.push(s));
    fixture.componentInstance.reopen.subscribe((s) => reopened.push(s));
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('[role="checkbox"]') as HTMLButtonElement;
  }

  it('marcar una pendiente la da por hecha', () => {
    const checkbox = render('PENDING');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    checkbox.click();
    expect(done.length).toBe(1);
    expect(reopened.length).toBe(0);
  });

  it('marcar una pospuesta también la da por hecha', () => {
    render('POSTPONED').click();
    expect(done.length).toBe(1);
  });

  it('desmarcar una hecha la devuelve a pendiente', () => {
    const checkbox = render('DONE');
    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.getAttribute('aria-label')).toContain('volver a pendiente');
    checkbox.click();
    expect(reopened.length).toBe(1);
    expect(done.length).toBe(0);
  });

  it('los botones de icono tienen etiqueta accesible y flotante', () => {
    render('PENDING');
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button[aria-label]') as NodeListOf<HTMLButtonElement>);
    const labels = buttons.map((button) => button.getAttribute('aria-label'));
    expect(labels).toEqual(jasmine.arrayContaining([
      'Editar Confirmar catering', 'Eliminar Confirmar catering', 'Posponer Confirmar catering', 'Reprogramar Confirmar catering'
    ]));
    expect(buttons.filter((button) => button.classList.contains('mat-mdc-tooltip-trigger')).length).toBeGreaterThanOrEqual(5);
  });
});
