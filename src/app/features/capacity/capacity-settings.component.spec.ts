import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CapacitySettingsComponent } from './capacity-settings.component';
import { CapacityStore } from './store/capacity.store';

describe('CapacitySettingsComponent', () => {
  let fixture: ComponentFixture<CapacitySettingsComponent>;
  let component: CapacitySettingsComponent;
  let store: {
    dailyLimitHours: ReturnType<typeof signal<number>>; saving: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string>>; ensureLoaded: jasmine.Spy; update: jasmine.Spy;
  };

  beforeEach(() => {
    store = {
      dailyLimitHours: signal(6), saving: signal(false), error: signal(''),
      ensureLoaded: jasmine.createSpy('ensureLoaded'), update: jasmine.createSpy('update')
    };
    TestBed.configureTestingModule({ providers: [provideNoopAnimations(), { provide: CapacityStore, useValue: store }] });
    fixture = TestBed.createComponent(CapacitySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('al guardar con éxito muestra un modal de confirmación', () => {
    component.adjust(-1);
    store.update.and.callFake((_hours: number, onSuccess: () => void) => onSuccess());
    component.save();
    fixture.detectChanges();
    expect(store.update).toHaveBeenCalledWith(5.5, jasmine.any(Function), jasmine.any(Function));
    expect(component.dialog()).toEqual({ heading: 'Capacidad actualizada', message: 'Tu capacidad diaria ahora es de 5.5 h por día.' });
    expect(document.body.textContent).toContain('Capacidad actualizada');
  });

  it('si falla muestra el error en un modal y, al cerrarlo, no queda repetido debajo', () => {
    component.adjust(1);
    store.update.and.callFake((_hours: number, _ok: () => void, onError: (message: string) => void) => {
      store.error.set('El servidor no respondió.');
      onError('El servidor no respondió.');
    });
    component.save();
    fixture.detectChanges();
    expect(component.dialog()).toEqual({ heading: 'No se pudo guardar la capacidad', message: 'El servidor no respondió.' });
    expect(fixture.nativeElement.querySelector('section [role="alert"]')).toBeNull();
    component.closeDialog();
    fixture.detectChanges();
    expect(component.dialog()).toBeNull();
    expect(fixture.nativeElement.querySelector('section [role="alert"]')).toBeNull();
  });
});
