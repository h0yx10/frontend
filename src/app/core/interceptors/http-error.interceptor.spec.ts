import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthStore } from '../auth/store/auth.store';
import { user } from '../auth/testing/auth.fixtures';
import { runtimeConfig } from '../config/runtime-config';
import { AppHttpError, httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let router: jasmine.SpyObj<Router>;
  let client: HttpClient;
  let http: HttpTestingController;
  const url = runtimeConfig.apiUrl;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthStore>('AuthStore',['isAuthenticated','isPublicUrl','clearSession','me','user']);
    auth.isAuthenticated.and.returnValue(true);
    auth.isPublicUrl.and.callFake(path => /\/auth\/(login|register)$/.test(path));
    auth.user.and.returnValue(user);
    auth.me.and.returnValue(of(user));
    router = jasmine.createSpyObj<Router>('Router',['navigate']);
    TestBed.configureTestingModule({providers:[
      provideHttpClient(withInterceptors([httpErrorInterceptor])), provideHttpClientTesting(),
      {provide:AuthStore,useValue:auth}, {provide:Router,useValue:router}
    ]});
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  for (const status of [400,403,404,409,500]) {
    it(`muestra message y conserva la sesión ante ${status}`, () => {
      client.get(`${url}/admin/users`).subscribe({error:(error:AppHttpError) => {
        expect(error.message).toBe('Motivo exacto del backend.');
        expect(error.status).toBe(status);
      }});
      http.expectOne(`${url}/admin/users`).flush({success:false,message:'Motivo exacto del backend.'},{status,statusText:'Error'});
      expect(auth.clearSession).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  }

  it('un 401 de login conserva la sesión', () => {
    client.post(`${url}/auth/login`,{}).subscribe({error:() => {}});
    http.expectOne(`${url}/auth/login`).flush({message:'Correo o contrasena incorrectos.'},{status:401,statusText:'Unauthorized'});
    expect(auth.clearSession).not.toHaveBeenCalled();
  });

  it('un 401 protegido limpia la sesión y redirige al login', () => {
    client.get(`${url}/auth/me`).subscribe({error:() => {}});
    http.expectOne(`${url}/auth/me`).flush({message:'Sesión inválida.'},{status:401,statusText:'Unauthorized'});
    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'],{queryParams:{expired:1}});
  });

  for (const path of ['/auth/me', `/admin/users/${user.id}`]) {
    it(`consulta /me y conserva el token ante un 401 de contraseña propia en ${path}`, () => {
      client.patch(`${url}${path}`,{password:'new-password'}).subscribe({error: (error:AppHttpError) => {
        expect(error.message).toBe('La contrasena actual es incorrecta.');
      }});
      http.expectOne(`${url}${path}`).flush({message:'La contrasena actual es incorrecta.'},{status:401,statusText:'Unauthorized'});
      expect(auth.me).toHaveBeenCalled();
      expect(auth.clearSession).not.toHaveBeenCalled();
    });
  }

  it('descarta la sesión si /me confirma que el token del PATCH ya no es válido', () => {
    auth.me.and.callFake(() => client.get(`${url}/auth/me`) as ReturnType<AuthStore['me']>);
    client.patch(`${url}/auth/me`,{password:'new-password'}).subscribe({error:(error:AppHttpError) => {
      expect(error.message).toBe('Error original del PATCH.');
    }});
    http.expectOne(`${url}/auth/me`).flush({message:'Error original del PATCH.'},{status:401,statusText:'Unauthorized'});
    const verification = http.expectOne(`${url}/auth/me`);
    expect(verification.request.method).toBe('GET');
    verification.flush({message:'Token inválido.'},{status:401,statusText:'Unauthorized'});
    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('no cierra sesión por un 401 de otro servidor', () => {
    client.get('https://otro.example/private').subscribe({error:() => {}});
    http.expectOne('https://otro.example/private').flush({message:'Unauthorized'},{status:401,statusText:'Unauthorized'});
    expect(auth.clearSession).not.toHaveBeenCalled();
  });

  it('preserva la información de sobrecarga de un 409 de negocio', () => {
    const overload = {plannedHours:8,limitHours:6,exceedsBy:2};
    client.get(`${url}/events`).subscribe({error:(error:AppHttpError) => expect(error.overload).toEqual(overload)});
    http.expectOne(`${url}/events`).flush({message:'Sobrecarga',...overload},{status:409,statusText:'Conflict'});
  });
});
