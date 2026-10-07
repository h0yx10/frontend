import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventDetailStore } from '../store/event-detail.store';
import { Subtask } from '../models/subtask.model';
import { SubtaskFormComponent } from './subtask-form.component';

const task: Subtask = {
  id:'task',eventId:'event',eventName:'Evento',name:'Catering',description:'Descripción anterior',
  targetDate:'2026-10-10',estimatedHours:2,status:'PENDING',note:null,doneAt:null,createdAt:'2026-10-06'
};

describe('SubtaskFormComponent: validación del contrato', () => {
  let fixture: ComponentFixture<SubtaskFormComponent>;
  let component: SubtaskFormComponent;
  let store: {subtaskFieldErrors: ReturnType<typeof signal<Record<string,string>>>; overloadTarget: ReturnType<typeof signal<Subtask | null>>; addSubtask:jasmine.Spy; updateSubtask:jasmine.Spy};

  beforeEach(async () => {
    store = {subtaskFieldErrors:signal<Record<string,string>>({}),overloadTarget:signal<Subtask | null>(null),addSubtask:jasmine.createSpy('addSubtask'),updateSubtask:jasmine.createSpy('updateSubtask')};
    await TestBed.configureTestingModule({imports:[SubtaskFormComponent],providers:[{provide:EventDetailStore,useValue:store}]})
      .overrideComponent(SubtaskFormComponent,{set:{template:''}}).compileComponents();
    fixture = TestBed.createComponent(SubtaskFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function valid() {
    component.name = task.name;
    component.targetDate = task.targetDate;
    component.estimatedHours = task.estimatedHours;
  }

  it('usa claves inglesas para los errores de campos requeridos', () => {
    component.submit();
    expect(Object.keys(store.subtaskFieldErrors())).toEqual(['name','targetDate','estimatedHours']);
    expect(store.addSubtask).not.toHaveBeenCalled();
  });

  it('rechaza una descripción mayor a 255 caracteres', () => {
    valid();
    component.description = 'a'.repeat(256);
    component.submit();
    expect(store.subtaskFieldErrors()['description']).toBe('La descripcion puede tener maximo 255 caracteres.');
    expect(store.addSubtask).not.toHaveBeenCalled();
  });

  it('acepta una descripción de 255 caracteres', () => {
    valid();
    component.description = 'a'.repeat(255);
    component.submit();
    expect(store.addSubtask).toHaveBeenCalled();
    expect(store.subtaskFieldErrors()).toEqual({});
  });

  it('permite vaciar la descripción de una subtarea enviando una cadena vacía', () => {
    fixture.componentRef.setInput('editing',task);
    valid();
    component.description = '';
    component.submit();
    expect(store.updateSubtask).toHaveBeenCalledWith(task.id,{
      name:task.name,description:'',targetDate:task.targetDate,estimatedHours:task.estimatedHours
    },jasmine.any(Function));
  });
});
