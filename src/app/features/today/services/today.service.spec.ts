import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { addDaysIso, todayIsoDate } from '../../../core/utils/date.util';
import { EventoResponseDto } from '../../events/models/event.model';
import { SubtareaResponseDto } from '../../events/models/subtask.model';
import { TodayService } from './today.service';

function response(data: unknown) {
  return {success:true,message:'OK',data,timestamp:'2026-10-06T15:15:30Z'};
}

describe('TodayService con subtareas en inglés', () => {
  let service: TodayService;
  let http: HttpTestingController;
  let event: EventoResponseDto;
  const url = runtimeConfig.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    service = TestBed.inject(TodayService);
    http = TestBed.inject(HttpTestingController);
    const today = todayIsoDate();
    const task: SubtareaResponseDto = {
      id:'today',eventId:'event-1',name:'Catering',description:'Confirmar menú',targetDate:today,
      estimatedHours:2,status:'PENDING',note:null,doneAt:null,createdAt:`${today}T10:00:00`
    };
    event = {
      id:'event-1',nombre:'Evento',tipo:'Social',cliente:null,contactoCliente:null,
      fechaHora:`${today}T10:00:00`,lugar:null,plazoLimite:null,organizadorId:'organizer',
      subtareas:[task,{...task,id:'overdue',targetDate:addDaysIso(today,-1)},
        {...task,id:'upcoming',targetDate:addDaysIso(today,1),status:'POSTPONED',note:'Esperando proveedor'},
        {...task,id:'done',status:'DONE',doneAt:`${today}T11:00:00`}]
    };
  });
  afterEach(() => http.verify());

  function flush() {
    const requests = http.match(req => req.url === `${url}/today`);
    expect(requests.length).toBe(2);
    requests.forEach(req => req.flush(response({vencidas:[],paraHoy:[],proximas:[],regla:'Regla'})));
    http.expectOne(`${url}/events`).flush(response([event]));
    http.expectOne(`${url}/capacity`).flush(response({limiteHoras:6,porDefecto:true,fecha:null}));
  }

  it('agrupa fechas, excluye DONE y conserva descripción y nota en el tablero', () => {
    service.load({eventId:'',status:''}).subscribe(board => {
      expect(board.overdue.map(task => task.id)).toEqual(['overdue']);
      expect(board.today.map(task => task.id)).toEqual(['today']);
      expect(board.upcoming.map(task => task.id)).toEqual(['upcoming']);
      expect(board.today[0].description).toBe('Confirmar menú');
      expect(board.today[0].eventName).toBe('Evento');
      expect(board.upcoming[0].note).toBe('Esperando proveedor');
      expect(board.capacity.plannedHours).toBe(2);
      expect(board.stats.completedLast7Days).toBe(1);
      expect(board.eventsToday[0].percentage).toBe(25);
    });
    flush();
  });

  it('filtra por eventId y status del contrato nuevo', () => {
    service.load({eventId:event.id,status:'POSTPONED'}).subscribe(board => {
      expect(board.today).toEqual([]);
      expect(board.overdue).toEqual([]);
      expect(board.upcoming.map(task => task.id)).toEqual(['upcoming']);
    });
    flush();
  });
});
