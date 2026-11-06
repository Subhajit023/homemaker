import Storage from 'expo-sqlite/kv-store';

import { createSampleSharing } from './sample-data';
import { DAY, effectiveEnd } from './time';
import type { SharingState } from './types';

/** Finished plans older than this are dropped to keep storage small. */
const HISTORY_MS = 7 * DAY;

export function sharingKey(householdId: string | null) {
  return householdId ? `sharing.${householdId}` : 'sharing.v1';
}

const EMPTY: SharingState = { members: [], things: [], bookings: [] };

/** Reads saved sharing data. Local mode falls back to sample data; a family cache starts empty. */
export function loadSharing(key: string): SharingState {
  try {
    const raw = Storage.getItemSync(key);
    if (raw) {
      const state = JSON.parse(raw) as SharingState;
      const cutoff = Date.now() - HISTORY_MS;
      return {
        ...state,
        members: state.members.map((m) => ({ ...m, phone: m.phone ?? '' })),
        bookings: state.bookings.filter((b) => effectiveEnd(b) > cutoff),
      };
    }
  } catch (error) {
    console.warn('Failed to load sharing data', error);
  }
  return key === sharingKey(null) ? createSampleSharing() : EMPTY;
}

export function saveSharing(key: string, state: SharingState) {
  Storage.setItemSync(key, JSON.stringify(state));
}
