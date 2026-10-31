import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { WorkloadStore } from '../../today/store/workload.store';
import { EventEntity } from '../models/event.model';
import { Subtask } from '../models/subtask.model';
import { ConflictsService } from '../services/conflicts.service';
import { EventsService } from '../services/events.service';
import { SubtasksService } from '../services/subtasks.service';
import { EventDetailStore } from './event-detail.store';

const event: EventEntity = {
  id:'event', organizerId:'organizer', name:'Boda', type:'Social',
  contact:'', datetime:'2030-01-01T10:00', place:'', progress:{done:0,total:1,percentage:0}
};
const task: Subtask = {
  id:'task',eventId:'event',eventName:'Boda',name:'Reservar salón',description:null,
  targetDate:'2029-12-20',estimatedHours:2,status:'PENDING',note:null,doneAt:null,createdAt:'2029-12-01'
};

/** Lo que cambia en el detalle de un evento tiene que verse también en la barra lateral (C4). */
describe('EventDetailStore: sincronía con la carga del día', () => {
  let store: EventDetailStore;
  let workload: jasmine.SpyObj<WorkloadStore>;
  let subtasks: jasmine.SpyObj<SubtasksService>;
  let events: jasmine.SpyObj<EventsService>;

  beforeEach(() => {
    workload = jasmine.createSpyObj<WorkloadStore>('WorkloadStore',['refresh']);
    subtasks = jasmine.createSpyObj<SubtasksService>('SubtasksService',['listByEvent','create','update','delete','execute']);
    events = jasmine.createSpyObj<EventsService>('EventsService',['get']);
    events.get.and.returnValue(of(event));
    subtasks.listByEvent.and.returnValue(of([task]));
    TestBed.configureTestingModule({providers:[
      EventDetailStore,
      {provide:WorkloadStore,useValue:workload},
      {provide:SubtasksService,useValue:subtasks},
      {provide:EventsService,useValue:events},
      {provide:ConflictsService,useValue:{}}
    ]});
    store = TestBed.inject(EventDetailStore);
    store.load(event.id);
  });

  it('marcar hecha refresca la carga del día y el progreso del evento', () => {
    events.get.and.returnValue(of({...event,progress:{done:1,total:1,percentage:100}}));
    subtasks.execute.and.returnValue(of({...task,status:'DONE'}));

    store.executeSubtask(task.id, {status:'DONE'});

    expect(workload.refresh).toHaveBeenCalledTimes(1);
    expect(store.event()?.progress.done).toBe(1);
  });

  it('agregar, quitar o reprogramar desde un diálogo también la refrescan', () => {
    subtasks.create.and.returnValue(of({...task,id:'other'}));
    subtasks.delete.and.returnValue(of(undefined));

    store.addSubtask({name:'Flores',targetDate:'2029-12-20',estimatedHours:1}, () => undefined);
    store.deleteSubtask('other');
    store.applySubtaskUpdate({...task,targetDate:'2029-12-21'});

    expect(workload.refresh).toHaveBeenCalledTimes(3);
    expect(store.subtasks()).toEqual([{...task,targetDate:'2029-12-21'}]);
  });
});
