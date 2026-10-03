import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AuthStore } from '../store/auth.store';
import { success, user } from '../testing/auth.fixtures';
import { ApiResponse } from '../../http/api-response.model';
import { User } from '../models/auth.model';
import { AccountPageComponent } from './account-page.component';

describe('AccountPageComponent', () => {
  let auth: jasmine.SpyObj<AuthStore>;
  let router: jasmine.SpyObj<Router>;
  let fixture: ComponentFixture<AccountPageComponent>;
  let component: AccountPageComponent;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthStore>('AuthStore',['user','canOrganize','updateProfile','deleteAccount']);
    auth.user.and.returnValue(user);
    auth.canOrganize.and.returnValue(true);
    auth.updateProfile.and.returnValue(of(success(user,'Perfil actualizado correctamente.')));
    auth.deleteAccount.and.returnValue(of(success(null)));
    router = jasmine.createSpyObj<Router>('Router',['navigate']);
    await TestBed.configureTestingModule({imports:[AccountPageComponent],providers:[
      provideNoopAnimations(), {provide:AuthStore,useValue:auth}, {provide:Router,useValue:router}
    ]}).compileComponents();
    fixture = TestBed.createComponent(AccountPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('precarga el nombre y correo del usuario', () => {
    expect(component.form.controls.nombre.value).toBe('Ana');
    expect(component.form.controls.correo.value).toBe('ana@example.com');
  });

  it('omite campos de contraseña vacíos al editar nombre y correo', () => {
    component.form.patchValue({nombre:' Ana Actualizada ',correo:' ana@example.com '});
    component.save();
    expect(auth.updateProfile).toHaveBeenCalledWith({nombre:'Ana Actualizada',correo:'ana@example.com'});
    expect(component.message()).toBe('Perfil actualizado correctamente.');
  });

  it('envía passwordActual sin trim y limpia las contraseñas tras el éxito', () => {
    component.form.patchValue({password:' new-password ',passwordActual:' old-password '});
    component.save();
    expect(auth.updateProfile).toHaveBeenCalledWith({nombre:'Ana',correo:'ana@example.com',password:' new-password ',passwordActual:' old-password '});
    expect(component.form.controls.password.value).toBe('');
    expect(component.form.controls.passwordActual.value).toBe('');
  });

  it('evita guardar de nuevo mientras hay una petición pendiente', () => {
    const pending = new Subject<ApiResponse<User>>();
    auth.updateProfile.and.returnValue(pending);
    component.save();
    component.save();
    expect(auth.updateProfile).toHaveBeenCalledTimes(1);
    expect(component.busy()).toBeTrue();
    pending.next(success(user));
    pending.complete();
    expect(component.busy()).toBeFalse();
  });

  it('muestra el error de contraseña actual sin redirigir', () => {
    auth.updateProfile.and.returnValue(throwError(() => new Error('La contrasena actual es incorrecta.')));
    component.save();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La contrasena actual es incorrecta.');
    expect(component.busy()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('requiere confirmar antes de eliminar la cuenta', () => {
    fixture.nativeElement.querySelector('button.text-danger').click();
    fixture.detectChanges();
    expect(component.confirmDelete()).toBeTrue();
    expect(auth.deleteAccount).not.toHaveBeenCalled();
  });

  it('redirige al login después de eliminar la cuenta', () => {
    component.deleteAccount();
    expect(auth.deleteAccount).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('muestra el conflicto de eliminación y conserva la pantalla de cuenta', () => {
    auth.deleteAccount.and.returnValue(throwError(() => new Error('No se puede eliminar un usuario con datos asociados.')));
    component.deleteAccount();
    expect(component.message()).toBe('No se puede eliminar un usuario con datos asociados.');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.busy()).toBeFalse();
  });
});
