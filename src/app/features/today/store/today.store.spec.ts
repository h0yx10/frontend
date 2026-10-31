import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Toast, ToastService } from '../../../core/feedback/toast.service';
import { Subtask } from '../../events/models/subtask.model';
import { SubtasksService } from '../../events/services/subtasks.service';
import { TodayService } from '../services/today.service';
import { TodayStore } from './today.store';
import { WorkloadStore } from './workload.store';

const task: Subtask = {
  id:'task',eventId:'event',eventName:'Boda',name:'Reservar salón',description:null,
  targetDate:'2026-10-31',estimatedHours:2,status:'POSTPONED',note:'Esperando proveedor',doneAt:null,createdAt:'2026-10-20'
};

describe('TodayStore: marcar hecha y deshacer', () => {
  let store: TodayStore;
  let subtasks: jasmine.SpyObj<SubtasksService>;
  let toasts: ToastService;

  beforeEach(() => {
    subtasks = jasmine.createSpyObj<SubtasksService>('SubtasksService',['execute']);
    const today = jasmine.createSpyObj<TodayService>('TodayService',['load']);
    today.load.and.returnValue(of({overdue:[],today:[],upcoming:[],capacity:{plannedHours:0,limitHours:6,percentage:0},
      stats:{overdueCount:0,todayCount:0,completedLast7Days:0,completedTrendPercentage:null,upcoming7DaysCount:0,upcoming7DaysEventsCount:0},
      keyTasks:[],eventsToday:[],conflictAlert:null,rule:''}));
    TestBed.configureTestingModule({providers:[
      TodayStore,
      {provide:SubtasksService,useValue:subtasks},
      {provide:TodayService,useValue:today},
      {provide:WorkloadStore,useValue:{apply:() => undefined}}
    ]});
    store = TestBed.inject(TodayStore);
    toasts = TestBed.inject(ToastService);
  });

  it('el aviso de "hecha" ofrece deshacer y restaura el estado previo (pospuesta)', () => {
    subtasks.execute.and.returnValues(of({...task,status:'DONE'}), of(task));

    store.executeSubtask(task.id, {status:'DONE'}, 'POSTPONED');
    const toast = toasts.toasts()[0] as Toast;
    expect(toast.message).toContain('«Reservar salón» marcada como hecha');
    expect(toast.action?.label).toBe('Deshacer');

    toasts.runAction(toast.id);

    expect(subtasks.execute.calls.mostRecent().args).toEqual(['task',{status:'POSTPONED'}]);
    expect(toasts.toasts()[0].message).toBe('«Reservar salón» volvió a tu lista.');
  });
});
