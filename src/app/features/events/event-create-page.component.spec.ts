import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { EventEntity } from './models/event.model';
import { EventsService } from './services/events.service';
import { EventCreatePageComponent } from './event-create-page.component';

const event: EventEntity = {
  id:'created-event', organizerId:'organizer', name:'Evento', type:'Social',
  contact:'', datetime:'2030-01-01T10:00', place:'', progress:{done:0,total:0,percentage:0}
};

describe('EventCreatePageComponent', () => {
  let component: EventCreatePageComponent;
  let service: jasmine.SpyObj<EventsService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    service = jasmine.createSpyObj<EventsService>('EventsService',['create']);
    service.create.and.returnValue(of(event));
    router = jasmine.createSpyObj<Router>('Router',['navigate']);
    TestBed.configureTestingModule({providers:[
      {provide:EventsService,useValue:service}, {provide:Router,useValue:router}
    ]});
    component = TestBed.runInInjectionContext(() => new EventCreatePageComponent());
    component.name = event.name;
    component.type = event.type;
    component.datetime = event.datetime;
  });

  it('guarda el ID para mostrar la confirmación y espera a que se acepte para navegar', () => {
    component.submit();
    expect(component.createdEventId()).toBe(event.id);
    expect(component.saving()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
    component.acceptCreated();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/evento',event.id]);
    expect(component.createdEventId()).toBeNull();
  });

  it('envía las subtareas iniciales con campos en inglés', () => {
    component.rows = [{name:' Catering ',targetDate:'2030-01-01',estimatedHours:2}];
    component.submit();
    expect(service.create).toHaveBeenCalledWith(jasmine.any(Object),[
      {name:'Catering',targetDate:'2030-01-01',estimatedHours:2}
    ]);
  });

  it('aceptar sin evento creado no navega', () => {
    component.acceptCreated();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('evita crear otro evento mientras la petición o confirmación está pendiente', () => {
    const request = new Subject<EventEntity>();
    service.create.and.returnValue(request);
    component.submit();
    component.submit();
    expect(service.create).toHaveBeenCalledTimes(1);
    request.next(event);
    request.complete();
    component.submit();
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(component.createdEventId()).toBe(event.id);
  });

  it('un error no muestra confirmación ni redirige', () => {
    service.create.and.returnValue(throwError(() => Object.assign(new Error('No se pudo crear el evento.'),{status:500,fieldErrors:{}})));
    component.submit();
    expect(component.error()).toBe('No se pudo crear el evento.');
    expect(component.createdEventId()).toBeNull();
    expect(component.saving()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('los campos requeridos vacíos impiden crear el evento', () => {
    component.name = '   ';
    component.submit();
    expect(service.create).not.toHaveBeenCalled();
    expect(component.fieldErrors()['nombre']).toBeTruthy();
    expect(component.saving()).toBeFalse();
  });
});
