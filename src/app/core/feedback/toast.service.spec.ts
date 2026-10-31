import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    service = TestBed.inject(ToastService);
  });

  it('muestra la confirmación y la retira sola', fakeAsync(() => {
    service.show('«Salón» marcada como hecha.');
    expect(service.toasts().map((toast) => toast.message)).toEqual(['«Salón» marcada como hecha.']);
    tick(5000);
    expect(service.toasts()).toEqual([]);
  }));

  it('conserva como máximo las tres más recientes', fakeAsync(() => {
    ['a', 'b', 'c', 'd'].forEach((message) => service.show(message));
    expect(service.toasts().map((toast) => toast.message)).toEqual(['b', 'c', 'd']);
    tick(5000);
  }));

  it('ejecuta la acción una sola vez y cierra el aviso', fakeAsync(() => {
    const undo = jasmine.createSpy('undo');
    service.show('«Salón» marcada como hecha.', 'success', {label:'Deshacer', run:undo});
    const id = service.toasts()[0].id;

    service.runAction(id);
    service.runAction(id);

    expect(undo).toHaveBeenCalledTimes(1);
    expect(service.toasts()).toEqual([]);
    tick(9000);
  }));

  it('un aviso con acción dura más para dar tiempo a deshacer', fakeAsync(() => {
    service.show('«Salón» marcada como hecha.', 'success', {label:'Deshacer', run:() => undefined});
    tick(5000);
    expect(service.toasts().length).toBe(1);
    tick(4000);
    expect(service.toasts()).toEqual([]);
  }));

  it('se puede cerrar antes de tiempo', fakeAsync(() => {
    service.show('Capacidad actualizada.', 'info');
    service.dismiss(service.toasts()[0].id);
    expect(service.toasts()).toEqual([]);
    tick(5000);
  }));
});
