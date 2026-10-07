import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EventEntity } from '../events/models/event.model';
import { Subtask } from '../events/models/subtask.model';
import { EventsService } from '../events/services/events.service';
import { TodayBoard, TodaySearch } from './models/today.model';
import { TodayStore } from './store/today.store';
import { TodayPageComponent } from './today-page.component';

const event: EventEntity = {
  id:'event-1', organizerId:'organizer', name:'Reunión', type:'Académico',
  contact:'', datetime:'2030-01-01T10:00', place:'Salón central', progress:{done:0,total:1,percentage:0}
};
const subtask: Subtask = {
  id:'task-1',eventId:event.id,eventName:event.name,name:'Reservar transporte',description:null,
  targetDate:'2030-01-01',estimatedHours:1,status:'PENDING',note:null,doneAt:null,createdAt:'2026-01-01'
};
const board: TodayBoard = {
  overdue:[subtask],today:[],upcoming:[],capacity:{plannedHours:1,limitHours:6,percentage:17},
  stats:{overdueCount:1,todayCount:0,completedLast7Days:0,completedTrendPercentage:null,upcoming7DaysCount:0,upcoming7DaysEventsCount:0},
  keyTasks:[],eventsToday:[],conflictAlert:null,rule:''
};

describe('TodayPageComponent', () => {
  let component: TodayPageComponent;
  let search: ReturnType<typeof signal<TodaySearch>>;
  let clearSearch: jasmine.Spy;

  beforeEach(() => {
    search = signal<TodaySearch>({query:'',eventId:''});
    clearSearch = jasmine.createSpy('clearSearch').and.callFake(() => search.set({query:'',eventId:''}));
    TestBed.configureTestingModule({providers:[
      {provide:EventsService,useValue:{list:() => of([event])}},
      {provide:TodayStore,useValue:{board:signal(board),search,load:jasmine.createSpy('load'),clearSearch}}
    ]});
    component = TestBed.runInInjectionContext(() => new TodayPageComponent());
  });

  it('detecta búsqueda por texto o evento, ignorando espacios vacíos', () => {
    expect(component.hasSearch()).toBeFalse();
    search.set({query:'   ',eventId:''});
    expect(component.hasSearch()).toBeFalse();
    search.set({query:'reunion',eventId:''});
    expect(component.hasSearch()).toBeTrue();
    search.set({query:'',eventId:event.id});
    expect(component.hasSearch()).toBeTrue();
  });

  for (const term of ['reunion','salon','academico','transporte']) {
    it(`filtra por ${term} sin depender de mayúsculas o tildes`, () => {
      search.set({query:` ${term.toUpperCase()} `,eventId:''});
      expect(component.overdueEvents().map(group => group.eventId)).toEqual([event.id]);
    });
  }

  it('filtra por evento y muestra vacío si no hay coincidencias', () => {
    search.set({query:'',eventId:'otro-evento'});
    expect(component.overdueEvents()).toEqual([]);
    expect(component.isEmpty).toBeTrue();
    search.set({query:'',eventId:event.id});
    expect(component.overdueEvents().length).toBe(1);
    expect(component.isEmpty).toBeFalse();
  });

  it('limpia ambas búsquedas y restaura los grupos visibles', () => {
    component.query.set('sin coincidencias');
    search.set({query:'otra búsqueda',eventId:'otro-evento'});
    expect(component.isEmpty).toBeTrue();
    component.clearSearch();
    expect(component.query()).toBe('');
    expect(clearSearch).toHaveBeenCalled();
    expect(component.hasSearch()).toBeFalse();
    expect(component.overdueEvents().length).toBe(1);
  });
});
