import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

const DURATION_MS = 4500;

/**
 * Confirmaciones breves tras una acción (gestión hecha, pospuesta, reprogramada, capacidad guardada).
 * Los errores no pasan por aquí: se muestran junto al formulario que los causó.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, tone: ToastTone = 'success'): void {
    const toast = { id: this.nextId++, message, tone };
    // Como máximo tres a la vez: una ráfaga de acciones no debe tapar la pantalla.
    this.toasts.update((current) => [...current, toast].slice(-3));
    setTimeout(() => this.dismiss(toast.id), DURATION_MS);
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
