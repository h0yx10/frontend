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

  it('se puede cerrar antes de tiempo', fakeAsync(() => {
    service.show('Capacidad actualizada.', 'info');
    service.dismiss(service.toasts()[0].id);
    expect(service.toasts()).toEqual([]);
    tick(5000);
  }));
});
