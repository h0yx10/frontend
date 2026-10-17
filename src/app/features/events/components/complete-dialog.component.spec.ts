import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Subtask } from '../models/subtask.model';
import { SubtasksService } from '../services/subtasks.service';
import { CompleteDialogComponent } from './complete-dialog.component';

const task: Subtask = {
  id:'task',eventId:'event',eventName:'Evento',name:'Buscar proveedor',description:null,
  targetDate:'2026-11-01',estimatedHours:2,status:'POSTPONED',note:'Esperando proveedor',doneAt:null,createdAt:'2026-10-06'
};

describe('CompleteDialogComponent: registrar ejecución con nota', () => {
  let fixture: ComponentFixture<CompleteDialogComponent>;
  let component: CompleteDialogComponent;
  let subtasks: jasmine.SpyObj<SubtasksService>;

  beforeEach(async () => {
    subtasks = jasmine.createSpyObj<SubtasksService>('SubtasksService',['execute']);
    await TestBed.configureTestingModule({imports:[CompleteDialogComponent],providers:[
      {provide:SubtasksService,useValue:subtasks}
    ]}).overrideComponent(CompleteDialogComponent,{set:{template:''}}).compileComponents();
    fixture = TestBed.createComponent(CompleteDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('subtask',task);
    fixture.detectChanges();
  });

  it('marca la gestión como hecha con la nota escrita', () => {
    const done = {...task,status:'DONE' as const,note:'Proveedor confirmó'};
    subtasks.execute.and.returnValue(of(done));
    const changed = jasmine.createSpy('changed');
    const closed = jasmine.createSpy('closed');
    component.changed.subscribe(changed);
    component.closed.subscribe(closed);

    component.note = '  Proveedor confirmó  ';
    component.confirm();

    expect(subtasks.execute).toHaveBeenCalledWith('task',{status:'DONE',note:'Proveedor confirmó'});
    expect(changed).toHaveBeenCalledWith(done);
    expect(closed).toHaveBeenCalled();
  });

  it('sin nota envía null para que el backend conserve la anterior', () => {
    subtasks.execute.and.returnValue(of({...task,status:'DONE' as const}));
    component.confirm();
    expect(subtasks.execute).toHaveBeenCalledWith('task',{status:'DONE',note:null});
  });

  it('muestra el error del backend y no cierra el diálogo', () => {
    subtasks.execute.and.returnValue(throwError(() => new Error('La nota puede tener maximo 1000 caracteres.')));
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.confirm();

    expect(component.error()).toBe('La nota puede tener maximo 1000 caracteres.');
    expect(component.saving()).toBeFalse();
    expect(closed).not.toHaveBeenCalled();
  });
});
