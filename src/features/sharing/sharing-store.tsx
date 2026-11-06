import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { useFamily } from '@/features/family/family-store';
import { bookingMapper, memberMapper, thingMapper } from '@/features/family/mappers';
import {
  cloudDelete,
  cloudUpsert,
  diffById,
  makeId,
  useCloudTable,
  type TableMapper,
} from '@/lib/cloud-sync';

import { MEMBER_COLORS } from './sample-data';
import { loadSharing, saveSharing, sharingKey } from './storage';
import { findConflict } from './time';
import type { Booking, BookingInput, Member, SharedThing, SharingState } from './types';

type AddBookingResult = { ok: true } | { ok: false; conflict: Booking };

type SharingContextValue = SharingState & {
  addMember: (name: string, emoji: string, phone: string) => void;
  updateMember: (id: string, patch: Partial<Omit<Member, 'id' | 'userId'>>) => void;
  removeMember: (id: string) => void;
  addThing: (name: string, emoji: string) => void;
  removeThing: (id: string) => void;
  /** Adds a booking unless it overlaps an existing one for the same thing. */
  addBooking: (input: BookingInput) => AddBookingResult;
  /** Hands a thing back now (ends an active booking early). */
  endBooking: (id: string) => void;
  cancelBooking: (id: string) => void;
  /** Current state, for "Undo". */
  snapshot: () => SharingState;
  restore: (state: SharingState) => void;
};

const SharingContext = createContext<SharingContextValue | null>(null);

/**
 * Family members, shared things and plans. Saved on the phone, and — once you're
 * in a family — synced live with everyone else through Supabase.
 */
export function SharingProvider({ children }: { children: ReactNode }) {
  const { family } = useFamily();
  const hid = family?.householdId ?? null;
  const key = sharingKey(hid);

  const [loadedKey, setLoadedKey] = useState(key);
  const [state, setState] = useState<SharingState>(() => loadSharing(key));

  if (loadedKey !== key) {
    setLoadedKey(key);
    setState(loadSharing(key));
  }

  useEffect(() => {
    if (loadedKey === key) saveSharing(key, state);
  }, [state, key, loadedKey]);

  useCloudTable(memberMapper, hid, (update) =>
    setState((s) => ({ ...s, members: update(s.members) }))
  );
  useCloudTable(thingMapper, hid, (update) =>
    setState((s) => ({ ...s, things: update(s.things) }))
  );
  useCloudTable(bookingMapper, hid, (update) =>
    setState((s) => ({ ...s, bookings: update(s.bookings) }))
  );

  function upsert<T>(mapper: TableMapper<T>, values: T[]) {
    cloudUpsert(mapper, hid, values);
  }

  const me = family?.memberId;
  const visibleBookings = me
    ? state.bookings.filter((b) => !(b.hiddenFrom ?? []).includes(me))
    : state.bookings;

  const value: SharingContextValue = {
    ...state,
    bookings: visibleBookings,
    addMember: (name, emoji, phone) => {
      const member: Member = {
        id: makeId('m'),
        name,
        emoji,
        phone,
        color: MEMBER_COLORS[state.members.length % MEMBER_COLORS.length],
      };
      setState((s) => ({ ...s, members: [...s.members, member] }));
      upsert(memberMapper, [member]);
    },
    updateMember: (id, patch) => {
      const current = state.members.find((m) => m.id === id);
      if (!current) return;
      const next = { ...current, ...patch };
      setState((s) => ({ ...s, members: s.members.map((m) => (m.id === id ? next : m)) }));
      upsert(memberMapper, [next]);
    },
    removeMember: (id) => {
      // The database removes their plans too (cascade).
      setState((s) => ({
        ...s,
        members: s.members.filter((m) => m.id !== id),
        bookings: s.bookings.filter((b) => b.memberId !== id),
      }));
      cloudDelete(memberMapper.table, hid, [id]);
    },
    addThing: (name, emoji) => {
      const thing: SharedThing = { id: makeId('t'), name, emoji };
      setState((s) => ({ ...s, things: [...s.things, thing] }));
      upsert(thingMapper, [thing]);
    },
    removeThing: (id) => {
      setState((s) => ({
        ...s,
        things: s.things.filter((t) => t.id !== id),
        bookings: s.bookings.filter((b) => b.thingId !== id),
      }));
      cloudDelete(thingMapper.table, hid, [id]);
    },
    addBooking: (input) => {
      const conflict = findConflict(state.bookings, input.thingId, input.start, input.end);
      if (conflict) return { ok: false, conflict };
      const booking: Booking = { ...input, id: makeId('b') };
      setState((s) => ({ ...s, bookings: [...s.bookings, booking] }));
      upsert(bookingMapper, [booking]);
      return { ok: true };
    },
    endBooking: (id) => {
      const current = state.bookings.find((b) => b.id === id);
      if (!current) return;
      const next = { ...current, returnedAt: Date.now() };
      setState((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? next : b)) }));
      upsert(bookingMapper, [next]);
    },
    cancelBooking: (id) => {
      setState((s) => ({ ...s, bookings: s.bookings.filter((b) => b.id !== id) }));
      cloudDelete(bookingMapper.table, hid, [id]);
    },
    snapshot: () => state,
    restore: (target) => {
      const current = state;
      setState(target);
      if (!hid) return;
      // Push the difference to the cloud: parents before children for inserts, reverse for deletes.
      const members = diffById(current.members, target.members);
      const things = diffById(current.things, target.things);
      const bookings = diffById(current.bookings, target.bookings);
      (async () => {
        await cloudDelete(bookingMapper.table, hid, bookings.deletes);
        await cloudDelete(thingMapper.table, hid, things.deletes);
        await cloudDelete(memberMapper.table, hid, members.deletes);
        await cloudUpsert(memberMapper, hid, members.upserts);
        await cloudUpsert(thingMapper, hid, things.upserts);
        await cloudUpsert(bookingMapper, hid, bookings.upserts);
      })();
    },
  };

  return <SharingContext value={value}>{children}</SharingContext>;
}

export function useSharing() {
  const ctx = use(SharingContext);
  if (!ctx) throw new Error('useSharing must be used inside <SharingProvider>');
  return ctx;
}
