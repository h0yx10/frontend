import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NavigationCancel, NavigationCancellationCode, NavigationEnd, NavigationStart, Router, Event } from '@angular/router';
import { Subject } from 'rxjs';

import { NavigationProgressService } from './navigation-progress.service';

describe('NavigationProgressService', () => {
  let events: Subject<Event>;
  let service: NavigationProgressService;

  beforeEach(() => {
    events = new Subject<Event>();
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: { events } }] });
    service = TestBed.inject(NavigationProgressService);
  });

  it('muestra la navegación pendiente sólo si tarda, y la limpia al terminar', fakeAsync(() => {
    events.next(new NavigationStart(1, '/progreso?q=boda'));
    tick(50);
    expect(service.pendingUrl()).toBeNull();
    tick(100);
    expect(service.isPending('/progreso')).toBeTrue();
    expect(service.isPending('/hoy')).toBeFalse();
    events.next(new NavigationEnd(1, '/progreso?q=boda', '/progreso?q=boda'));
    expect(service.pendingUrl()).toBeNull();
    expect(service.ready()).toBeTrue();
  }));

  it('una navegación rápida no llega a mostrar indicador', fakeAsync(() => {
    events.next(new NavigationStart(1, '/hoy'));
    tick(60);
    events.next(new NavigationEnd(1, '/hoy', '/hoy'));
    tick(200);
    expect(service.pendingUrl()).toBeNull();
  }));

  it('reconoce rutas hijas', fakeAsync(() => {
    events.next(new NavigationStart(1, '/evento/42'));
    tick(150);
    expect(service.isPending('/evento')).toBeTrue();
    expect(service.isPending('/eventos')).toBeFalse();
  }));

  it('una redirección de guard no da por lista la primera pantalla; un rechazo sí', () => {
    events.next(new NavigationCancel(1, '/hoy', 'redirect', NavigationCancellationCode.Redirect));
    expect(service.ready()).toBeFalse();
    events.next(new NavigationCancel(2, '/hoy', 'rechazo', NavigationCancellationCode.GuardRejected));
    expect(service.ready()).toBeTrue();
  });
});
