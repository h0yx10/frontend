import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SkeletonComponent } from './skeleton.component';

@Component({
  standalone: true,
  imports: [SkeletonComponent],
  template: `<app-skeleton height="40px" width="32px" radius="6px" /><app-skeleton />`
})
class HostComponent {}

describe('SkeletonComponent', () => {
  it('reserva el tamaño indicado y queda oculto para lectores de pantalla', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const [custom, standard] = Array.from(fixture.nativeElement.querySelectorAll('app-skeleton')) as HTMLElement[];
    expect(custom.style.height).toBe('40px');
    expect(custom.style.width).toBe('32px');
    expect(custom.style.borderRadius).toBe('6px');
    expect(custom.getAttribute('aria-hidden')).toBe('true');
    expect(standard.style.height).toBe('34px');
    expect(standard.style.width).toBe('100%');
  });
});
