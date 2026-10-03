import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { AuthStore } from '../store/auth.store';
import { user } from '../testing/auth.fixtures';
import { AppHttpError } from '../../interceptors/http-error.interceptor';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let router: jasmine.SpyObj<Router>;
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let snapshot: {data: Record<string,string>; queryParamMap: ReturnType<typeof convertToParamMap>};

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthStore>('AuthStore',['login','register','canOrganize','homeUrl']);
    auth.canOrganize.and.returnValue(true);
    auth.homeUrl.and.returnValue('/hoy');
    auth.login.and.returnValue(of(user));
    auth.register.and.returnValue(of(user));
    router = jasmine.createSpyObj<Router>('Router',['navigate','navigateByUrl']);
    snapshot = {data:{}, queryParamMap:convertToParamMap({})};
    await TestBed.configureTestingModule({imports:[LoginPageComponent],providers:[
      {provide:AuthStore,useValue:auth}, {provide:Router,useValue:router},
      {provide:ActivatedRoute,useValue:{snapshot}}
    ]}).compileComponents();
  });

  function create(mode = 'login', params: Record<string,string> = {}) {
    snapshot.data = {mode};
    snapshot.queryParamMap = convertToParamMap(params);
    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function validForm() {
    component.form.setValue({name:'Ana',email:'ana@example.com',password:'password'});
  }

  it('no envía formularios inválidos y muestra el mensaje requerido', () => {
    create();
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(component.fieldError('email')).toBe('Escribe tu correo.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Escribe tu correo.');
  });

  for (const mode of ['login', 'register']) {
    it(`muestra los campos vacíos de ${mode} sin enviar credenciales al backend`, () => {
      create(mode);
      fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(auth.login).not.toHaveBeenCalled();
      expect(auth.register).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('#email-error').textContent).toContain('Escribe tu correo.');
      expect(fixture.nativeElement.querySelector('#password-error').textContent).toContain('Escribe tu contrasena.');
      expect(fixture.nativeElement.querySelector('#email').getAttribute('aria-invalid')).toBe('true');
      if (mode === 'register') {
        expect(fixture.nativeElement.querySelector('#name-error').textContent).toContain('Escribe un nombre.');
      }
    });

    it(`rechaza correo o contraseña con solo espacios en ${mode}`, () => {
      create(mode);
      validForm();
      component.form.patchValue({ email: '   ', password: '        ' });
      component.submit();
      expect(auth.login).not.toHaveBeenCalled();
      expect(auth.register).not.toHaveBeenCalled();
      expect(component.fieldError('email')).toBe('Escribe tu correo.');
      expect(component.fieldError('password')).toBe('Escribe tu contrasena.');
    });

    it(`permite ver y ocultar la contraseña en ${mode} sin enviar el formulario`, () => {
      create(mode);
      validForm();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-controls="password"]');
      expect(input.type).toBe('password');
      button.click();
      fixture.detectChanges();
      expect(input.type).toBe('text');
      expect(input.value).toBe('password');
      expect(button.getAttribute('aria-label')).toBe('Ocultar contraseña');
      expect(button.getAttribute('aria-pressed')).toBe('true');
      button.click();
      fixture.detectChanges();
      expect(input.type).toBe('password');
      expect(button.getAttribute('aria-label')).toBe('Mostrar contraseña');
      expect(auth.login).not.toHaveBeenCalled();
      expect(auth.register).not.toHaveBeenCalled();
    });
  }

  it('muestra y retira la validación mientras se corrige el correo', () => {
    create();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#email');
    input.value = 'correo-invalido';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#email-error').textContent).toContain('Escribe un correo valido.');
    input.value = 'ana@example.com';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#email-error')).toBeNull();
  });

  it('retira el mensaje de credenciales anterior cuando se modifica un campo', () => {
    auth.login.and.returnValue(throwError(() => new Error('Correo o contrasena incorrectos.')));
    create();
    validForm();
    component.submit();
    expect(component.error()).toBe('Correo o contrasena incorrectos.');
    component.form.controls.password.setValue('otra-password');
    expect(component.error()).toBe('');
  });

  it('retira el error del servidor del campo que se está corrigiendo', () => {
    const error = Object.assign(new Error('Correo inválido'), {status:400,fieldErrors:{correo:'Escribe un correo valido.'}}) as AppHttpError;
    auth.login.and.returnValue(throwError(() => error));
    create();
    validForm();
    component.submit();
    expect(component.fieldError('email')).toBe('Escribe un correo valido.');
    component.form.controls.email.setValue('otro@example.com');
    expect(component.fieldError('email')).toBe('');
  });

  it('evita enviar dos solicitudes de login mientras espera respuesta', () => {
    const pending = new Subject<typeof user>();
    auth.login.and.returnValue(pending);
    create();
    validForm();
    component.submit();
    component.submit();
    expect(auth.login).toHaveBeenCalledTimes(1);
    pending.complete();
  });

  for (const [password, valid] of [
    ['a'.repeat(7),false], ['a'.repeat(8),true], ['a'.repeat(72),true], ['a'.repeat(73),false],
    ['😀'.repeat(7),false], ['😀'.repeat(8),true], ['á'.repeat(36),true], ['á'.repeat(37),false]
  ] as const) {
    it(`valida ${Array.from(password).length} caracteres y ${new TextEncoder().encode(password).length} bytes en registro`, () => {
      create('register');
      validForm();
      component.form.controls.password.setValue(password);
      expect(component.form.controls.password.valid).toBe(valid);
    });
  }

  it('rechaza nombre compuesto solo por espacios en registro', () => {
    create('register');
    validForm();
    component.form.controls.name.setValue('   ');
    component.submit();
    expect(auth.register).not.toHaveBeenCalled();
    expect(component.fieldError('name')).toBe('Escribe un nombre.');
  });

  it('el login permite contraseñas existentes sin aplicar límites de registro', () => {
    create();
    component.form.patchValue({email:'ana@example.com',password:'short'});
    component.submit();
    expect(auth.login).toHaveBeenCalledWith({email:'ana@example.com',password:'short'});
  });

  it('envía el registro y redirige al destino protegido solicitado', () => {
    create('register',{returnUrl:'/evento/123'});
    validForm();
    component.submit();
    expect(auth.register).toHaveBeenCalledWith({name:'Ana',email:'ana@example.com',password:'password'});
    expect(router.navigateByUrl).toHaveBeenCalledWith('/evento/123');
  });

  for (const destination of ['https://otro.example','//otro.example','/login','/register?x=1']) {
    it(`descarta returnUrl inválido: ${destination}`, () => {
      create('login',{returnUrl:destination});
      validForm();
      component.submit();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/hoy');
    });
  }

  it('redirige un ADMIN sin ORGANIZADOR a Mi cuenta', () => {
    auth.canOrganize.and.returnValue(false);
    auth.homeUrl.and.returnValue('/cuenta');
    create('login',{returnUrl:'/hoy'});
    validForm();
    component.submit();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cuenta');
  });

  it('desactiva el botón mientras el login está pendiente y muestra errores del backend', () => {
    const pending = new Subject<typeof user>();
    auth.login.and.returnValue(pending);
    create();
    validForm();
    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    pending.error(new Error('Correo o contrasena incorrectos.'));
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Correo o contrasena incorrectos.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('mapea los errores de campo del backend al formulario', () => {
    const error = Object.assign(new Error('Correo inválido'), {status:400,fieldErrors:{correo:'Escribe un correo valido.'}}) as AppHttpError;
    auth.login.and.returnValue(throwError(() => error));
    create();
    validForm();
    component.submit();
    expect(component.fieldError('email')).toBe('Escribe un correo valido.');
  });

  it('cambia entre las rutas de login y registro conservando los parámetros', () => {
    create();
    component.toggleMode();
    expect(router.navigate).toHaveBeenCalledWith(['/register'],{queryParamsHandling:'preserve'});
  });
});
