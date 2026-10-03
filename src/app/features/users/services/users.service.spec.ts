import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { success, usuario } from '../../../core/auth/testing/auth.fixtures';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;
  const url = `${runtimeConfig.apiUrl}/admin/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista usuarios desde la ruta administrativa', () => {
    service.list().subscribe(response => expect(response.data).toEqual([usuario]));
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(success([usuario]));
  });

  it('consulta por ID de cuenta, separado del ID de organizador', () => {
    service.get(usuario.id).subscribe(response => expect(response.data.organizadorId).toBe('profile-id'));
    const req = http.expectOne(`${url}/account-id`);
    expect(req.request.method).toBe('GET');
    req.flush(success(usuario));
  });

  it('crea una cuenta con roles y recibe usuario sin token', () => {
    const body = {nombre:'Admin',correo:'admin@example.com',password:'password',roles:['ADMIN'] as const};
    service.create({...body,roles:[...body.roles]}).subscribe(response => {
      expect(response.data.organizadorId).toBeNull();
      expect(response.data.roles).toEqual(['ADMIN']);
    });
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(success({...usuario,nombre:'Admin',roles:['ADMIN'],organizadorId:null}));
  });

  it('envía la lista completa de roles y actividad mediante PATCH', () => {
    const body = {roles:['ADMIN','ORGANIZADOR'] as const,activo:false};
    service.update(usuario.id,{...body,roles:[...body.roles]}).subscribe();
    const req = http.expectOne(`${url}/account-id`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush(success({...usuario,roles:[...body.roles],activo:false}));
  });

  it('elimina por ID de cuenta y conserva el sobre con data null', () => {
    service.delete(usuario.id).subscribe(response => expect(response.data).toBeNull());
    const req = http.expectOne(`${url}/account-id`);
    expect(req.request.method).toBe('DELETE');
    req.flush(success(null));
  });
});
