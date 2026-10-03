import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { runtimeConfig } from '../../config/runtime-config';
import { AuthStore } from '../store/auth.store';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthStore>('AuthStore', ['token', 'isPublicUrl']);
    auth.token.and.returnValue('token');
    auth.isPublicUrl.and.callFake(url => /\/auth\/(login|register)$/.test(url));
    TestBed.configureTestingModule({providers:[
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
      {provide:AuthStore,useValue:auth}
    ]});
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('agrega Bearer a las peticiones protegidas del backend', () => {
    client.get(`${runtimeConfig.apiUrl}/auth/me`).subscribe();
    const req = http.expectOne(`${runtimeConfig.apiUrl}/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    req.flush({});
  });

  it('envía el token de la sesión que se va a revocar en POST /logout', () => {
    client.post(`${runtimeConfig.apiUrl}/auth/logout`,null).subscribe();
    const req = http.expectOne(`${runtimeConfig.apiUrl}/auth/logout`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    expect(req.request.body).toBeNull();
    req.flush({});
  });

  for (const path of ['/auth/login','/auth/register']) {
    it(`no agrega el token a ${path}`, () => {
      client.post(`${runtimeConfig.apiUrl}${path}`,{}).subscribe();
      const req = http.expectOne(`${runtimeConfig.apiUrl}${path}`);
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  }

  it('no agrega Authorization si no hay sesión', () => {
    auth.token.and.returnValue(null);
    client.get(`${runtimeConfig.apiUrl}/auth/me`).subscribe();
    const req = http.expectOne(`${runtimeConfig.apiUrl}/auth/me`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('no filtra el token a otro servidor', () => {
    client.get('https://otro.example/api/data').subscribe();
    const req = http.expectOne('https://otro.example/api/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
