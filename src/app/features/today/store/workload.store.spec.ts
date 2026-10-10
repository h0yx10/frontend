import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';

import { TodayService } from '../services/today.service';
import { WorkloadStore } from './workload.store';

type Workload = { plannedHours: number; overdueCount: number; todayCount: number };

describe('WorkloadStore', () => {
  let store: WorkloadStore;
  let service: jasmine.SpyObj<TodayService>;

  beforeEach(() => {
    service = jasmine.createSpyObj<TodayService>('TodayService', ['loadWorkload']);
    TestBed.configureTestingModule({ providers: [{ provide: TodayService, useValue: service }] });
    store = TestBed.inject(WorkloadStore);
  });

  it('indica la consulta en curso y marca los datos como listos al responder', () => {
    const response = new Subject<Workload>();
    service.loadWorkload.and.returnValue(response);
    store.refresh();
    expect(store.loading()).toBeTrue();
    expect(store.loaded()).toBeFalse();
    response.next({ plannedHours: 4.5, overdueCount: 1, todayCount: 3 });
    response.complete();
    expect(store.loading()).toBeFalse();
    expect(store.loaded()).toBeTrue();
    expect(store.plannedHours()).toBe(4.5);
    expect(store.attentionCount()).toBe(4);
    expect(store.overdueCount()).toBe(1);
  });

  it('una consulta nueva reemplaza a la anterior', () => {
    const first = new Subject<Workload>();
    const second = new Subject<Workload>();
    service.loadWorkload.and.returnValues(first, second);
    store.refresh();
    store.refresh();
    first.next({ plannedHours: 9, overdueCount: 9, todayCount: 9 });
    expect(store.loaded()).toBeFalse();
    second.next({ plannedHours: 2, overdueCount: 0, todayCount: 1 });
    second.complete();
    expect(store.plannedHours()).toBe(2);
    expect(store.loading()).toBeFalse();
  });

  it('un error deja de consultar sin inventar datos', () => {
    service.loadWorkload.and.returnValue(throwError(() => new Error('sin red')));
    store.refresh();
    expect(store.loading()).toBeFalse();
    expect(store.loaded()).toBeFalse();
  });
});
