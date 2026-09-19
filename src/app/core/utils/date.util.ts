/** Utilidades de fecha compartidas por la UI y por el motor mock del API. */

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function addDaysIso(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(year, month - 1, day + days);
  return toIsoDate(date);
}

export function compareIsoDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export type DateBucket = 'OVERDUE' | 'TODAY' | 'UPCOMING';

export function classifyByDate(dateIso: string, referenceIso = todayIsoDate()): DateBucket {
  const comparison = compareIsoDates(dateIso, referenceIso);
  if (comparison < 0) {
    return 'OVERDUE';
  }
  if (comparison === 0) {
    return 'TODAY';
  }
  return 'UPCOMING';
}

const HUMAN_DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short'
});

const HUMAN_DATETIME_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

export function formatIsoDateHuman(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  return HUMAN_DATE_FORMATTER.format(new Date(year, month - 1, day));
}

export function formatIsoDateShort(dateIso: string): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  return SHORT_DATE_FORMATTER.format(new Date(year, month - 1, day)).replace('.', '');
}

export function formatDateTimeHuman(isoDateTime: string): string {
  return HUMAN_DATETIME_FORMATTER.format(new Date(isoDateTime));
}

/** Formatea sólo la fecha (día + mes corto) de un timestamp ISO completo, p. ej. `doneAt`. */
export function formatDateOnlyShort(isoDateTime: string): string {
  return SHORT_DATE_FORMATTER.format(new Date(isoDateTime)).replace('.', '');
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidDateTime(value: string): boolean {
  if (!value) {
    return false;
  }
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp);
}

/** El backend espera `yyyy-MM-dd'T'HH:mm:ss`; el input datetime-local sólo da `yyyy-MM-ddTHH:mm`. */
export function withSeconds(isoDateTime: string): string {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isoDateTime) ? `${isoDateTime}:00` : isoDateTime;
}

/** Recorta un datetime ISO con segundos a `yyyy-MM-ddTHH:mm` para el input datetime-local. */
export function withoutSeconds(isoDateTime: string): string {
  return isoDateTime.slice(0, 16);
}
