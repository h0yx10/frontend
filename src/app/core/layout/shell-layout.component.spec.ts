import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ShellLayoutComponent } from './shell-layout.component';
import { authInterceptor } from '../auth/interceptors/auth.interceptor';
import { AuthStore } from '../auth/store/auth.store';
import { sessionDto, success } from '../auth/testing/auth.fixtures';
import { runtimeConfig } from '../config/runtime-config';
import { httpErrorInterceptor } from '../interceptors/http-error.interceptor';
import { CapacityStore } from '../../features/capacity/store/capacity.store';

const storageKey = 'events_planner::session';

describe('ShellLayoutComponent', () => {
  let fixture: ComponentFixture<ShellLayoutComponent>;
  let auth: AuthStore;
  let http: HttpTestingController;
  let navigate: jasmine.Spy;
  const url = `${runtimeConfig.apiUrl}/auth`;

  beforeEach(async () => {
    localStorage.removeItem(storageKey);
    await TestBed.configureTestingModule({
      imports: [ShellLayoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([httpErrorInterceptor, authInterceptor])),
        provideHttpClientTesting(),
        {provide:CapacityStore, useValue:{dailyLimitHours:() => 6, ensureLoaded:() => {}}}
      ]
    }).compileComponents();
    auth = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router),'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(ShellLayoutComponent);
  });

  afterEach(() => {
    auth.clearSession();
    http.verify();
  });

  function login() {
    auth.login({email:'ana@example.com',password:'password'}).subscribe();
    http.expectOne(`${url}/login`).flush(success(sessionDto));
    fixture.detectChanges();
  }

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('envía logout con Bearer, bloquea solicitudes duplicadas y limpia la sesión después del 200', () => {
    login();
    fixture.componentInstance.logout();
    fixture.componentInstance.logout();
    fixture.detectChanges();
    const req = http.expectOne(`${url}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(auth.isAuthenticated()).toBeTrue();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Cerrando sesión…');
    req.flush(success(null,'Cerraste sesion correctamente.'));
    expect(auth.user()).toBeNull();
    expect(auth.token()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(fixture.componentInstance.loggingOut()).toBeFalse();
  });

  it('el 401 de logout limpia la sesión y navega al login sin marcar expiración', () => {
    login();
    fixture.componentInstance.logout();
    http.expectOne(`${url}/logout`).flush({message:'Token revocado.'},{status:401,statusText:'Unauthorized'});
    expect(auth.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(navigate).toHaveBeenCalledOnceWith(['/login']);
    expect(fixture.componentInstance.logoutError()).toBe('');
  });

  for (const status of [0,500]) {
    it(`muestra el error de logout ${status}, conserva la sesión y permite reintentar desde la pantalla`, () => {
      login();
      const stored = localStorage.getItem(storageKey);
      fixture.componentInstance.logout();
      const req = http.expectOne(`${url}/logout`);
      if (status === 0) {
        req.error(new ProgressEvent('error'));
      } else {
        req.flush({message:'Ocurrio un inconveniente. Intentalo nuevamente mas tarde.'},{status,statusText:'Server Error'});
      }
      fixture.detectChanges();
      expect(auth.isAuthenticated()).toBeTrue();
      expect(localStorage.getItem(storageKey)).toBe(stored);
      expect(navigate).not.toHaveBeenCalled();
      expect(fixture.componentInstance.loggingOut()).toBeFalse();
      const alert: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
      expect(alert.textContent).toContain(status === 0 ? 'No fue posible conectar con el servidor.' : 'Ocurrio un inconveniente. Intentalo nuevamente mas tarde.');
      alert.querySelector('button')!.click();
      const retry = http.expectOne(`${url}/logout`);
      expect(retry.request.headers.get('Authorization')).toBe('Bearer test-token');
      retry.flush(success(null));
      expect(auth.isAuthenticated()).toBeFalse();
      expect(navigate).toHaveBeenCalledOnceWith(['/login']);
    });
  }
});
