import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { sessionDto, success, user, usuario } from '../testing/auth.fixtures';
import { AuthStore } from './auth.store';

const storageKey = 'events_planner::session';

describe('AuthStore', () => {
  let service: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let store: AuthStore;

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    service = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register', 'me', 'updateProfile', 'deleteAccount', 'isPublicUrl', 'logout']);
    service.login.and.returnValue(of(success(sessionDto)));
    service.register.and.returnValue(of(success(sessionDto)));
    service.me.and.returnValue(of(success(usuario)));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({ providers: [
      { provide: AuthService, useValue: service }, { provide: Router, useValue: router }
    ] });
  });

  afterEach(() => {
    store?.clearSession();
    localStorage.removeItem(storageKey);
  });

  function login() {
    store = TestBed.inject(AuthStore);
    store.login({ email: user.email, password: 'password' }).subscribe();
  }

  it('inicia sesión, separa los IDs y persiste la expiración en milisegundos', () => {
    const now = Date.now();
    spyOn(Date, 'now').and.returnValue(now);
    login();
    expect(store.user()).toEqual(user);
    expect(store.token()).toBe('test-token');
    expect(store.isAuthenticated()).toBeTrue();
    expect(JSON.parse(localStorage.getItem(storageKey)!).expiresAt).toBe(now + 7200 * 1000);
  });

  it('el registro también inicia sesión', () => {
    store = TestBed.inject(AuthStore);
    store.register({name:'Ana', email:user.email, password:'password'}).subscribe();
    expect(store.isAuthenticated()).toBeTrue();
    expect(store.canOrganize()).toBeTrue();
  });

  it('restaura una sesión vigente y refresca sus roles desde /me', () => {
    localStorage.setItem(storageKey, JSON.stringify({ token:'saved', user, expiresAt:Date.now() + 60000 }));
    service.me.and.returnValue(of(success({...usuario, roles:['ADMIN' as const], organizadorId:null})));
    store = TestBed.inject(AuthStore);
    expect(store.token()).toBe('saved');
    store.restoreSession();
    expect(service.me).toHaveBeenCalled();
    expect(store.hasRole('ADMIN')).toBeTrue();
    expect(store.canOrganize()).toBeFalse();
    expect(store.homeUrl()).toBe('/cuenta');
    expect(store.user()?.organizerId).toBeNull();
  });

  for (const [description, value] of [
    ['JSON inválido', '{invalid'],
    ['sesión expirada', JSON.stringify({token:'old', user, expiresAt:1})],
    ['sesión sin token', JSON.stringify({user, expiresAt:Date.now() + 60000})]
  ]) {
    it(`descarta ${description}`, () => {
      localStorage.setItem(storageKey, value);
      store = TestBed.inject(AuthStore);
      expect(store.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(storageKey)).toBeNull();
    });
  }

  it('no consulta /me sin sesión guardada', () => {
    store = TestBed.inject(AuthStore);
    store.restoreSession();
    expect(service.me).not.toHaveBeenCalled();
  });

  it('expira el token sin refresh y redirige al login', fakeAsync(() => {
    service.login.and.returnValue(of(success({...sessionDto, expiresIn:2})));
    login();
    tick(1999);
    expect(store.isAuthenticated()).toBeTrue();
    tick(1);
    expect(store.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('cerrar sesión cancela la redirección pendiente por expiración', fakeAsync(() => {
    service.login.and.returnValue(of(success({...sessionDto, expiresIn:2})));
    login();
    store.clearSession();
    tick(2000);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(store.token()).toBeNull();
  }));

  it('actualiza y persiste el perfil conservando el token', () => {
    login();
    service.updateProfile.and.returnValue(of(success({...usuario, nombre:'Ana Actualizada'})));
    store.updateProfile({nombre:'Ana Actualizada'}).subscribe(response => {
      expect(response.message).toBe('Mensaje del backend.');
    });
    expect(store.user()?.name).toBe('Ana Actualizada');
    expect(store.token()).toBe('test-token');
    expect(JSON.parse(localStorage.getItem(storageKey)!).user.name).toBe('Ana Actualizada');
  });

  it('conserva la cuenta y sesión cuando el borrado falla con 409', () => {
    login();
    service.deleteAccount.and.returnValue(throwError(() => ({status:409})));
    store.deleteAccount().subscribe({error: error => expect(error.status).toBe(409)});
    expect(store.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem(storageKey)).not.toBeNull();
  });

  it('borra la sesión después de eliminar la cuenta correctamente', () => {
    login();
    service.deleteAccount.and.returnValue(of(success(null)));
    store.deleteAccount().subscribe();
    expect(store.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('conserva el token hasta que el servidor confirme logout con 200', () => {
    login();
    const pending = new Subject<ReturnType<typeof success<null>>>();
    service.logout.and.returnValue(pending);
    store.logout().subscribe();
    expect(store.token()).toBe('test-token');
    expect(localStorage.getItem(storageKey)).not.toBeNull();
    pending.next(success(null));
    pending.complete();
    expect(store.token()).toBeNull();
    expect(store.user()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('el 401 de logout elimina la sesión ya inválida sin propagar un error', () => {
    login();
    service.logout.and.returnValue(throwError(() => ({status:401})));
    const completed = jasmine.createSpy('completed');
    store.logout().subscribe({next:completed,error:() => fail('Un 401 debe completar el cierre local')});
    expect(completed).toHaveBeenCalled();
    expect(store.isAuthenticated()).toBeFalse();
    expect(store.user()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  for (const status of [0,500]) {
    it(`conserva toda la sesión ante logout ${status} y permite reintentar`, () => {
      login();
      const stored = localStorage.getItem(storageKey);
      service.logout.and.returnValue(throwError(() => ({status,message:'Fallo al cerrar sesión'})));
      store.logout().subscribe({error:error => expect(error.status).toBe(status)});
      expect(store.token()).toBe('test-token');
      expect(store.user()).toEqual(user);
      expect(localStorage.getItem(storageKey)).toBe(stored);
      service.logout.and.returnValue(of(success(null)));
      store.logout().subscribe();
      expect(service.logout).toHaveBeenCalledTimes(2);
      expect(store.isAuthenticated()).toBeFalse();
    });
  }

  it('un perfil inactivo pierde acceso al negocio aunque conserve ORGANIZADOR', () => {
    login();
    service.me.and.returnValue(of(success({...usuario, activo:false})));
    store.me().subscribe();
    expect(store.hasRole('ORGANIZADOR')).toBeTrue();
    expect(store.canOrganize()).toBeFalse();
  });
});
