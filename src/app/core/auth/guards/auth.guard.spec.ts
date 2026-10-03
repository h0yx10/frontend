import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { AuthStore } from '../store/auth.store';
import { user } from '../testing/auth.fixtures';
import { authGuard, guestGuard, organizerGuard } from './auth.guard';

describe('Guards de autenticación', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let router: Router;
  const route = {} as ActivatedRouteSnapshot;
  const state = {url:'/evento/123'} as RouterStateSnapshot;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthStore>('AuthStore', ['isAuthenticated', 'homeUrl', 'me', 'canOrganize']);
    TestBed.configureTestingModule({providers:[provideRouter([]), {provide:AuthStore, useValue:auth}]});
    router = TestBed.inject(Router);
  });

  it('envía al login conservando returnUrl cuando no hay sesión', () => {
    auth.isAuthenticated.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state)) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fevento%2F123');
  });

  it('permite rutas protegidas con sesión', () => {
    auth.isAuthenticated.and.returnValue(true);
    expect(TestBed.runInInjectionContext(() => authGuard(route,state))).toBeTrue();
  });

  it('permite login y registro a invitados', () => {
    auth.isAuthenticated.and.returnValue(false);
    expect(TestBed.runInInjectionContext(() => guestGuard(route,state))).toBeTrue();
  });

  it('envía a Mi cuenta al ADMIN autenticado sin acceso al negocio', () => {
    auth.isAuthenticated.and.returnValue(true);
    auth.homeUrl.and.returnValue('/cuenta');
    const result = TestBed.runInInjectionContext(() => guestGuard(route,state)) as UrlTree;
    expect(router.serializeUrl(result)).toBe('/cuenta');
  });

  it('consulta los permisos actuales antes de permitir una vista de negocio', () => {
    auth.me.and.returnValue(of(user));
    auth.canOrganize.and.returnValue(true);
    const result = TestBed.runInInjectionContext(() => organizerGuard(route,state)) as Observable<boolean | UrlTree>;
    result.subscribe(value => expect(value).toBeTrue());
    expect(auth.me).toHaveBeenCalled();
  });

  it('envía a Mi cuenta si /me refleja la retirada de ORGANIZADOR', () => {
    auth.me.and.returnValue(of({...user,roles:['ADMIN']}));
    auth.canOrganize.and.returnValue(false);
    const result = TestBed.runInInjectionContext(() => organizerGuard(route,state)) as Observable<boolean | UrlTree>;
    result.subscribe(value => expect(router.serializeUrl(value as UrlTree)).toBe('/cuenta'));
  });

  it('impide abrir negocio si la consulta /me falla', () => {
    auth.me.and.returnValue(throwError(() => new Error('Sin sesión')));
    const result = TestBed.runInInjectionContext(() => organizerGuard(route,state)) as Observable<boolean | UrlTree>;
    result.subscribe(value => expect(router.serializeUrl(value as UrlTree)).toBe('/cuenta'));
  });
});
