import { locale, strings } from '@/i18n';

import type { Booking } from './types';

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(t: number, days: number) {
  const d = new Date(t);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** The given day at hh:mm. */
export function atTime(day: number, hours: number, minutes: number) {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

export function formatTime(t: number) {
  return new Date(t).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
}

export function formatDay(t: number, now = Date.now()) {
  const diff = Math.round((startOfDay(t) - startOfDay(now)) / DAY);
  const words = strings().time;
  if (diff === 0) return words.today;
  if (diff === 1) return words.tomorrow;
  if (diff === -1) return words.yesterday;
  return new Date(t).toLocaleDateString(locale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatRange(start: number, end: number) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatDuration(ms: number) {
  const words = strings().time;
  const minutes = Math.max(1, Math.round(ms / MINUTE));
  if (minutes < 60) return words.minutes(minutes);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? words.hoursMinutes(h, m) : words.hours(h);
}

/** Durations offered when planning; labels are `strings().time.durations[i]`. */
export const DURATIONS = [30, 60, 120, 180, 300, 600];

// ---- Booking helpers ----

export function effectiveEnd(b: Booking) {
  return b.returnedAt ?? b.end;
}

export function isActive(b: Booking, now: number) {
  return b.start <= now && now < effectiveEnd(b);
}

export function isUpcoming(b: Booking, now: number) {
  return b.start > now && !b.returnedAt;
}

/** A booking for the same shared thing that overlaps [start, end), if any. */
export function findConflict(
  bookings: Booking[],
  thingId: string | null,
  start: number,
  end: number,
  ignoreId?: string
) {
  if (!thingId) return undefined; // personal plans never clash
  return bookings.find(
    (b) =>
      b.thingId === thingId &&
      b.id !== ignoreId &&
      b.start < end &&
      start < effectiveEnd(b)
  );
}

/** "just now", "5 min ago", "2 hrs ago", "Yesterday, 8:30 PM", "Mon, 3 Nov, 8:30 PM" */
export function formatAgo(t: number, now = Date.now()) {
  const words = strings().time;
  const diff = now - t;
  if (diff < MINUTE) return words.justNow;
  if (diff < HOUR) return words.minAgo(Math.floor(diff / MINUTE));
  if (diff < 6 * HOUR) return words.hrsAgo(Math.floor(diff / HOUR));
  return `${formatDay(t, now)}, ${formatTime(t)}`;
}
