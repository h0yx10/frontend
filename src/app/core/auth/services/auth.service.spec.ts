import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { runtimeConfig } from '../../config/runtime-config';
import { sessionDto, success, usuario } from '../testing/auth.fixtures';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const url = `${runtimeConfig.apiUrl}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('envía login con correo normalizado y conserva los espacios de la contraseña', () => {
    service.login({ email: ' ana@example.com ', password: ' password ' }).subscribe(response => {
      expect(response.data).toEqual(sessionDto);
    });
    const req = http.expectOne(`${url}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ correo: 'ana@example.com', password: ' password ' });
    req.flush(success(sessionDto));
  });

  it('envía registro con las propiedades del contrato', () => {
    service.register({ name: ' Ana ', email: ' ana@example.com ', password: ' password ' }).subscribe();
    const req = http.expectOne(`${url}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'Ana', correo: 'ana@example.com', password: ' password ' });
    req.flush(success(sessionDto));
  });

  it('consulta el usuario mediante GET /me', () => {
    service.me().subscribe(response => expect(response.data.organizadorId).toBe('profile-id'));
    const req = http.expectOne(`${url}/me`);
    expect(req.request.method).toBe('GET');
    req.flush(success(usuario));
  });

  it('actualiza el perfil usando PATCH y passwordActual', () => {
    const body = { password: ' new-password ', passwordActual: ' old-password ' };
    service.updateProfile(body).subscribe();
    const req = http.expectOne(`${url}/me`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush(success(usuario));
  });

  it('elimina la cuenta mediante DELETE /me y acepta data null', () => {
    service.deleteAccount().subscribe(response => expect(response.data).toBeNull());
    const req = http.expectOne(`${url}/me`);
    expect(req.request.method).toBe('DELETE');
    req.flush(success(null));
  });

  it('envía POST /logout sin body y conserva el mensaje del backend', () => {
    service.logout().subscribe(response => {
      expect(response.data).toBeNull();
      expect(response.message).toBe('Cerraste sesion correctamente.');
    });
    const req = http.expectOne(`${url}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeNull();
    req.flush(success(null, 'Cerraste sesion correctamente.'));
    expect(service.isPublicUrl(`${url}/logout`)).toBeFalse();
  });

  it('solo reconoce login y register como rutas públicas exactas', () => {
    expect(service.isPublicUrl(`${url}/login?next=1`)).toBeTrue();
    expect(service.isPublicUrl(`${url}/register#form`)).toBeTrue();
    expect(service.isPublicUrl(`${url}/login-extra`)).toBeFalse();
    expect(service.isPublicUrl(`${url}/me`)).toBeFalse();
  });
});
