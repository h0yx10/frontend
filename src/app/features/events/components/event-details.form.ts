import { FormBuilder } from '@angular/forms';

import { EVENT_TYPE_OPTIONS, EventPayload } from '../models/event.model';

/** Valores de los campos de un evento, compartidos por Nuevo evento y la edición del detalle. */
export interface EventDetailsValue {
  name: string;
  type: string;
  date: string;
  time: string;
  place: string;
  contact: string;
  deadline: string;
}

/** Valores de los campos a partir de un evento existente (o vacíos para uno nuevo). */
export function eventDetailsValue(initial?: Partial<EventPayload> | null): EventDetailsValue {
  const [date = '', time = ''] = (initial?.datetime ?? '').split('T');
  return {
    name: initial?.name ?? '',
    type: initial?.type || EVENT_TYPE_OPTIONS[0],
    date,
    time: time.slice(0, 5),
    place: initial?.place ?? '',
    contact: initial?.contact ?? '',
    deadline: initial?.deadline ?? ''
  };
}

/** Controles de los datos del evento; se pueden mezclar en un formulario mayor (p. ej. con las subtareas). */
export function eventDetailsControls(formBuilder: FormBuilder, initial?: Partial<EventPayload> | null) {
  const value = eventDetailsValue(initial);
  return {
    name: formBuilder.nonNullable.control(value.name),
    type: formBuilder.nonNullable.control(value.type),
    date: formBuilder.nonNullable.control(value.date),
    time: formBuilder.nonNullable.control(value.time),
    place: formBuilder.nonNullable.control(value.place),
    contact: formBuilder.nonNullable.control(value.contact),
    deadline: formBuilder.nonNullable.control(value.deadline)
  };
}

/**
 * Reglas de los datos del evento. Las claves de error son las del backend (`nombre`, `fechaHora`…),
 * así los errores locales y los del servidor se muestran en el mismo sitio.
 *
 * `originalDate`: al editar, conservar la fecha que el evento ya tenía es válido aunque haya pasado;
 * sólo una fecha nueva debe ser de hoy en adelante.
 */
export function validateEventDetails(value: EventDetailsValue, today: string, originalDate = ''): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!value.name.trim()) {
    errors['nombre'] = 'No ingresaste el nombre del evento.';
  }
  if (!value.type.trim()) {
    errors['tipo'] = 'No ingresaste el tipo de evento.';
  }
  if (!value.date) {
    errors['fechaHora'] = 'No ingresaste la fecha de inicio.';
  } else if (value.date < today && value.date !== originalDate) {
    errors['fechaHora'] = 'La fecha de inicio no puede ser anterior a hoy.';
  }
  if (!value.time) {
    errors['hora'] = 'No ingresaste la hora del evento.';
  }
  if (value.deadline && value.date && value.deadline < value.date) {
    errors['plazoLimite'] = 'La fecha límite no puede ser anterior a la fecha de inicio.';
  } else if (value.deadline && !value.date && value.deadline < today) {
    errors['plazoLimite'] = 'La fecha límite no puede ser anterior a hoy.';
  }
  return errors;
}

export function toEventPayload(value: EventDetailsValue): EventPayload {
  return {
    name: value.name.trim(),
    type: value.type.trim(),
    contact: value.contact.trim(),
    datetime: `${value.date}T${value.time}`,
    place: value.place.trim(),
    deadline: value.deadline
  };
}
