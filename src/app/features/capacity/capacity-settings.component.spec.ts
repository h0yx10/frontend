import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastService } from '../../core/feedback/toast.service';
import { WorkloadStore } from '../today/store/workload.store';
import { CapacitySettingsComponent } from './capacity-settings.component';
import { CapacityStore } from './store/capacity.store';

describe('CapacitySettingsComponent: editor del límite diario', () => {
  let fixture: ComponentFixture<CapacitySettingsComponent>;
  let component: CapacitySettingsComponent;
  let store: {dailyLimitHours: ReturnType<typeof signal<number>>; saving: ReturnType<typeof signal<boolean>>; error: ReturnType<typeof signal<string>>; minimumLimit: ReturnType<typeof signal<number | null>>; ensureLoaded: jasmine.Spy; update: jasmine.Spy};
  let plannedToday: ReturnType<typeof signal<number>>;
  let toasts: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    store = {dailyLimitHours:signal(6), saving:signal(false), error:signal(''), minimumLimit:signal<number | null>(null), ensureLoaded:jasmine.createSpy('ensureLoaded'), update:jasmine.createSpy('update')};
    plannedToday = signal(0);
    toasts = jasmine.createSpyObj<ToastService>('ToastService',['show']);
    await TestBed.configureTestingModule({imports:[CapacitySettingsComponent],providers:[
      {provide:CapacityStore,useValue:store},
      {provide:WorkloadStore,useValue:{plannedHours:plannedToday}},
      {provide:ToastService,useValue:toasts}
    ]}).overrideComponent(CapacitySettingsComponent,{set:{template:''}}).compileComponents();
    fixture = TestBed.createComponent(CapacitySettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('valida el rango de 1 a 16 horas', () => {
    component.onHoursChange(0.5);
    expect(component.validationError()).toContain('entre 1 y 16');
    component.onHoursChange(16.5);
    expect(component.validationError()).toContain('entre 1 y 16');
    component.onHoursChange(null);
    expect(component.validationError()).toBe('Indica el límite de horas diario.');
    component.save();
    expect(store.update).not.toHaveBeenCalled();
  });

  it('no deja bajar el límite por debajo de lo ya planificado hoy', () => {
    plannedToday.set(6);
    component.onHoursChange(5.5);
    expect(component.validationError()).toContain('Hoy ya tienes 6 h planificadas');
    component.save();
    expect(store.update).not.toHaveBeenCalled();
  });

  it('guarda un límite válido, confirma y avisa para cerrar el panel', () => {
    store.update.and.callFake((_hours: number, onSuccess: () => void) => onSuccess());
    const saved = jasmine.createSpy('saved');
    component.saved.subscribe(saved);

    component.onHoursChange(8);
    component.save();

    expect(store.update).toHaveBeenCalledWith(8, jasmine.any(Function));
    expect(toasts.show).toHaveBeenCalledWith('Límite diario actualizado a 8 h.');
    expect(saved).toHaveBeenCalled();
  });

  it('ofrece el mínimo permitido sin cambiar lo escrito hasta que se pulsa "Usar"', () => {
    plannedToday.set(4.5);
    component.onHoursChange(4);
    expect(component.suggestion()).toBe(4.5);
    expect(component.hours()).toBe(4);

    component.useSuggestion();
    expect(component.hours()).toBe(4.5);
    expect(component.validationError()).toBe('');
    expect(component.suggestion()).toBeNull();
  });

  it('fuera de rango sugiere el extremo válido', () => {
    component.onHoursChange(20);
    expect(component.suggestion()).toBe(16);
    component.onHoursChange(0.5);
    expect(component.suggestion()).toBe(1);
  });

  it('tras un 409 usa como mínimo el día más cargado que informó el backend', () => {
    store.minimumLimit.set(6);
    component.onHoursChange(5);
    expect(component.validationError()).toContain('Hay un día con 6 h planificadas');
    expect(component.suggestion()).toBe(6);
  });

  it('al cambiar el valor se borra el rechazo anterior del servidor', () => {
    store.error.set('No puedes bajar el limite a 5 h: hay dias con mas horas planificadas (18/10/2026: 6 h).');
    component.onHoursChange(7);
    expect(store.error()).toBe('');
  });
});
