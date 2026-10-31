import { formatIsoDateShort } from '../../../core/utils/date.util';

/** Rango permitido para el plazo de una subtarea (`yyyy-MM-dd`; vacío = sin límite). */
export interface SubtaskDateBounds {
  min: string;
  max: string;
  /** Fecha de inicio del evento, para el mensaje cuando es ella la que manda. */
  start: string;
}

/**
 * El plazo de una subtarea va desde hoy (y nunca antes de la fecha de inicio del evento)
 * hasta la fecha límite del evento, si la tiene.
 */
export function subtaskDateBounds(today: string, eventStart = '', eventDeadline = ''): SubtaskDateBounds {
  const start = eventStart.slice(0, 10);
  return { min: start > today ? start : today, max: eventDeadline.slice(0, 10), start };
}

/** Mensaje de error del plazo, o cadena vacía si es válido. */
export function validateSubtaskDate(date: string, bounds: SubtaskDateBounds): string {
  if (!date) return '';
  if (date < bounds.min) {
    return bounds.min === bounds.start
      ? `El plazo no puede ser anterior a la fecha de inicio del evento (${formatIsoDateShort(bounds.start)}).`
      : 'El plazo no puede ser un día pasado.';
  }
  if (bounds.max && date > bounds.max) {
    return `El plazo no puede ser posterior a la fecha límite del evento (${formatIsoDateShort(bounds.max)}).`;
  }
  return '';
}
