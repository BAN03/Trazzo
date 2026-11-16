/**
 * Utilidades numéricas compartidas por los formularios.
 *
 * Las cantidades se capturan con punto decimal y se redondean a 2 decimales
 * para evitar errores de punto flotante (0.1 + 0.2 = 0.30000000000000004).
 */

/** Limpia un número decimal: permite un punto y máximo 2 decimales. */
export const sanitizeDecimal = (value: string): string => {
  const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const [integerPart, ...rest] = cleaned.split('.');
  if (rest.length === 0) return integerPart.slice(0, 9);
  const decimals = rest.join('').slice(0, 2);
  return `${integerPart.slice(0, 9)}.${decimals}`;
};

/** Convierte texto a número; regresa NaN si no es válido. */
export const parseAmount = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

/** Redondea cantidades a 2 decimales. */
export const roundQuantity = (value: number): number => Math.round(value * 100) / 100;

/** Muestra una cantidad sin ceros innecesarios: 1.50 -> "1.5", 2 -> "2". */
export const formatQuantity = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return String(roundQuantity(value));
};
