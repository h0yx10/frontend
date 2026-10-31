import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'info' | 'warning';

/** Acción opcional del aviso, p. ej. "Deshacer" tras marcar una gestión como hecha. */
export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
}

const DURATION_MS = 4500;
/** Un aviso con acción dura más: hay que leerlo y decidir si se deshace. */
const DURATION_WITH_ACTION_MS = 8000;

/**
 * Confirmaciones breves tras una acción (gestión hecha, pospuesta, reprogramada, capacidad guardada).
 * Los errores no pasan por aquí: se muestran junto al formulario que los causó.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, tone: ToastTone = 'success', action?: ToastAction): void {
    const toast: Toast = { id: this.nextId++, message, tone, action };
    // Como máximo tres a la vez: una ráfaga de acciones no debe tapar la pantalla.
    this.toasts.update((current) => [...current, toast].slice(-3));
    setTimeout(() => this.dismiss(toast.id), action ? DURATION_WITH_ACTION_MS : DURATION_MS);
  }

  /** Ejecuta la acción del aviso y lo cierra, para que no se pueda pulsar dos veces. */
  runAction(id: number): void {
    const toast = this.toasts().find((item) => item.id === id);
    this.dismiss(id);
    toast?.action?.run();
  }

  dismiss(id: number): void {
    this.toasts.update((current) => current.filter((toast) => toast.id !== id));
  }
}
