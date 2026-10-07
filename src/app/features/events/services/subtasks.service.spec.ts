import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { SubtareaResponseDto } from '../models/subtask.model';
import { mapEventFromDto } from './events.service';
import { mapSubtaskFromDto, SubtasksService } from './subtasks.service';

const dto: SubtareaResponseDto = {
  id:'task-1',eventId:'event-1',name:'Confirmar catering',description:'Confirmar menú',
  targetDate:'2026-10-10',estimatedHours:2,status:'PENDING',note:null,doneAt:null,createdAt:'2026-10-06T10:15:30'
};
function response(data: unknown) {
  return {success:true,message:'La subtarea se creo correctamente.',data,timestamp:'2026-10-06T15:15:30Z'};
}

describe('SubtasksService: contrato en inglés', () => {
  let service: SubtasksService;
  let http: HttpTestingController;
  const url = runtimeConfig.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    service = TestBed.inject(SubtasksService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('crea con campos ingleses y lee la descripción de la respuesta', () => {
    const payload = {name:dto.name,description:dto.description,targetDate:dto.targetDate,estimatedHours:dto.estimatedHours};
    service.create(dto.eventId,payload).subscribe(task => {
      expect(task).toEqual({...dto,eventName:''});
    });
    const req = http.expectOne(`${url}/events/${dto.eventId}/subtasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(response(dto));
  });

  it('omite la descripción si no se proporciona al crear', () => {
    service.create(dto.eventId,{name:dto.name,targetDate:dto.targetDate,estimatedHours:2}).subscribe();
    const req = http.expectOne(`${url}/events/${dto.eventId}/subtasks`);
    expect(Object.hasOwn(req.request.body,'description')).toBeFalse();
    req.flush(response({...dto,description:null}));
  });

  it('lista subtareas con ID de evento, estado y nota del contrato nuevo', () => {
    const item: SubtareaResponseDto = {...dto,status:'POSTPONED',note:'Esperando proveedor',description:null};
    service.listByEvent(dto.eventId).subscribe(tasks => expect(tasks).toEqual([{...item,eventName:''}]));
    http.expectOne(`${url}/events/${dto.eventId}/subtasks`).flush(response([item]));
  });

  for (const description of ['Nueva descripción','',null]) {
    it(`envía únicamente description en un PATCH con valor ${JSON.stringify(description)}`, () => {
      service.update(dto.id,{description}).subscribe();
      const req = http.expectOne(`${url}/subtasks/${dto.id}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({description});
      req.flush(response({...dto,description:description ?? dto.description}));
    });
  }

  it('reprograma con targetDate y estimatedHours sin enviar campos omitidos', () => {
    service.update(dto.id,{targetDate:'2026-10-11',estimatedHours:1.5}).subscribe();
    const req = http.expectOne(`${url}/subtasks/${dto.id}`);
    expect(req.request.body).toEqual({targetDate:'2026-10-11',estimatedHours:1.5});
    req.flush(response({...dto,targetDate:'2026-10-11',estimatedHours:1.5}));
  });

  it('envía status y note por PATCH /status', () => {
    service.execute(dto.id,{status:'POSTPONED',note:'Esperando proveedor'}).subscribe(task => {
      expect(task.note).toBe('Esperando proveedor');
      expect(task.status).toBe('POSTPONED');
    });
    const req = http.expectOne(`${url}/subtasks/${dto.id}/status`);
    expect(req.request.body).toEqual({status:'POSTPONED',note:'Esperando proveedor'});
    req.flush(response({...dto,status:'POSTPONED',note:'Esperando proveedor'}));
  });

  it('mantiene la descripción y resuelve el nombre del evento al mapear', () => {
    expect(mapSubtaskFromDto(dto,'Evento')).toEqual({...dto,eventName:'Evento'});
  });

  it('calcula progreso de eventos desde el status inglés de las subtareas anidadas', () => {
    const event = mapEventFromDto({
      id:dto.eventId,nombre:'Evento',tipo:'Social',cliente:null,contactoCliente:null,
      fechaHora:'2026-10-10T10:00:00',lugar:null,plazoLimite:null,organizadorId:'organizer',
      subtareas:[dto,{...dto,id:'task-2',status:'DONE'}]
    });
    expect(event.progress).toEqual({done:1,total:2,percentage:50});
  });
});
