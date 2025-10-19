// src/common/tz.util.ts
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const BUSINESS_TZ = 'America/Guatemala';

/**
 * Límites (inicio/fin) del día de negocio, en UTC.
 */
export function dayBoundsInUTC(date: Date = new Date()) {
  // 1) Llevar el instante recibido a la zona de negocio
  const zoned = toZonedTime(date, BUSINESS_TZ);             // UTC -> zona

  // 2) Calcular inicio/fin del día *local*
  const startZoned = startOfDay(zoned);
  const endZoned   = endOfDay(zoned);

  // 3) Convertir esos límites de vuelta a UTC
  const startUtc = fromZonedTime(startZoned, BUSINESS_TZ);  // zona -> UTC
  const endUtc   = fromZonedTime(endZoned,   BUSINESS_TZ);  // zona -> UTC

  return { startUtc, endUtc };
}
