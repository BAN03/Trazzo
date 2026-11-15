/**
 * Utilidades de fecha compartidas.
 *
 * Todas las fechas que se guardan en SQLite usan el formato local
 * `YYYY-MM-DD`. Nunca se usa `toISOString()` para fechas de negocio porque
 * convierte a UTC y en México (UTC-6) provoca que un día se convierta en el
 * anterior.
 */

export const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

export const WEEKDAY_LABELS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

const pad = (value: number) => String(value).padStart(2, '0');

/** Convierte una fecha local a `YYYY-MM-DD` sin pasar por UTC. */
export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Regresa la fecha de hoy como `YYYY-MM-DD` en horario local. */
export const todayKey = (): string => toDateKey(new Date());

/** Interpreta `YYYY-MM-DD` como medianoche local. Regresa `null` si es inválida. */
export const parseDateKey = (key?: string | null): Date | null => {
  if (!key) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const isValidDateKey = (key?: string | null): boolean => parseDateKey(key) !== null;

/** Suma (o resta) días a una fecha local. */
export const addDays = (date: Date, days: number): Date => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
};

/** Suma (o resta) meses cuidando el desbordamiento de fin de mes. */
export const addMonths = (date: Date, months: number): Date => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
};

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const endOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/**
 * Semana de domingo a sábado en la que cae `date`.
 * Se devuelven claves `YYYY-MM-DD` listas para comparar con SQLite.
 */
export const getWeekBounds = (date: Date): { start: string; end: string } => {
  const start = addDays(date, -date.getDay());
  const end = addDays(start, 6);
  return { start: toDateKey(start), end: toDateKey(end) };
};

/** Límites del mes de `date` como claves `YYYY-MM-DD`. */
export const getMonthBounds = (date: Date): { start: string; end: string } => ({
  start: toDateKey(startOfMonth(date)),
  end: toDateKey(endOfMonth(date)),
});

/** Texto largo: "noviembre de 2026". */
export const formatMonthLabel = (date: Date): string =>
  `${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;

/** Texto corto: "15 nov 2026". */
export const formatDateKeyShort = (key?: string | null): string => {
  const date = parseDateKey(key);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
};

/** Texto largo: "15 de noviembre de 2026". */
export const formatDateKeyLong = (key?: string | null): string => {
  const date = parseDateKey(key);
  if (!date) return '—';
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]} de ${date.getFullYear()}`;
};

/** Día y mes: "15 nov". */
export const formatDateKeyDayMonth = (key?: string | null): string => {
  const date = parseDateKey(key);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()].slice(0, 3)}`;
};

/** Primer día del calendario visible (siempre domingo) para un mes. */
export const getCalendarStart = (month: Date): Date => {
  const first = startOfMonth(month);
  return addDays(first, -first.getDay());
};

/** Máximo de meses hacia atrás que permite el selector de la app. */
export const MAX_MONTHS_BACK = 1;

export const canGoToPreviousMonth = (month: Date, now: Date = new Date()): boolean => {
  const previous = addMonths(startOfMonth(month), -1);
  const oldest = addMonths(startOfMonth(now), -MAX_MONTHS_BACK);
  return previous.getTime() >= oldest.getTime();
};

export const canGoToNextMonth = (month: Date, now: Date = new Date()): boolean =>
  addMonths(startOfMonth(month), 1).getTime() <= startOfMonth(now).getTime();

/** Compara dos claves de fecha (`YYYY-MM-DD`). */
export const compareDateKeys = (a: string, b: string): number => a.localeCompare(b);

export const clampDateKey = (key: string, minimum?: string, maximum?: string): string => {
  if (minimum && compareDateKeys(key, minimum) < 0) return minimum;
  if (maximum && compareDateKeys(key, maximum) > 0) return maximum;
  return key;
};
