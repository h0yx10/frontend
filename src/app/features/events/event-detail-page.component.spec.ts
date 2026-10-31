import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EventDetailPageComponent } from './event-detail-page.component';
import { EventDetailStore } from './store/event-detail.store';

describe('EventDetailPageComponent: evento no encontrado', () => {
  let fixture: ComponentFixture<EventDetailPageComponent>;

  beforeEach(async () => {
    const store = {
      load: jasmine.createSpy('load'), loading: signal(false), notFound: signal(true), error: signal(''),
      event: signal(null), subtasks: signal([]), saving: signal(false), successMessage: signal(''),
      overload: signal(null), subtaskFieldErrors: signal({}), eventFieldErrors: signal({}), clearOverload: () => undefined
    };
    await TestBed.configureTestingModule({
      imports:[EventDetailPageComponent],
      providers:[
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {provide:ActivatedRoute,useValue:{paramMap:of(convertToParamMap({id:'no-existe'})),snapshot:{paramMap:convertToParamMap({id:'no-existe'})}}}
      ]
    }).overrideComponent(EventDetailPageComponent,{set:{providers:[{provide:EventDetailStore,useValue:store}]}}).compileComponents();
    fixture = TestBed.createComponent(EventDetailPageComponent);
    fixture.detectChanges();
  });

  it('explica el problema y ofrece salidas a Progreso y a Hoy', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Evento no encontrado');
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('a')).map((link) => [link.textContent?.trim(), link.getAttribute('href')]);
    expect(links).toContain(['Ir a Progreso','/progreso']);
    expect(links).toContain(['Ir a Hoy','/hoy']);
  });
});
