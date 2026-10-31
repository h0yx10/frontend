import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Subtask } from '../../events/models/subtask.model';
import { TodayItemComponent } from './today-item.component';

const task: Subtask = {
  id:'task',eventId:'event',eventName:'Boda',name:'Buscar proveedor',description:null,
  targetDate:'2026-10-20',estimatedHours:2,status:'PENDING',note:null,doneAt:null,createdAt:'2026-10-01'
};

describe('TodayItemComponent: acciones de una gestión en Hoy', () => {
  let fixture: ComponentFixture<TodayItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports:[TodayItemComponent]}).compileComponents();
    fixture = TestBed.createComponent(TodayItemComponent);
  });

  function render(subtask: Subtask, bucket: 'OVERDUE' | 'TODAY' | 'UPCOMING') {
    fixture.componentRef.setInput('subtask',subtask);
    fixture.componentRef.setInput('bucket',bucket);
    fixture.detectChanges();
  }

  function postponeButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button[aria-label="Posponer Buscar proveedor"]');
  }

  for (const bucket of ['OVERDUE','TODAY','UPCOMING'] as const) {
    it(`ofrece posponer en ${bucket}, con el nombre de la gestión en su etiqueta`, () => {
      render(task, bucket);
      expect(postponeButton()).not.toBeNull();
    });
  }

  it('no ofrece posponer una gestión que ya está pospuesta', () => {
    render({...task,status:'POSTPONED'}, 'OVERDUE');
    expect(postponeButton()).toBeNull();
  });

  it('posponer avisa con la gestión', () => {
    render(task, 'OVERDUE');
    let emitted: Subtask | undefined;
    fixture.componentInstance.postpone.subscribe((value) => (emitted = value));
    postponeButton()!.click();
    expect(emitted).toEqual(task);
  });
});
