import type { Item } from '@/features/inventory/types';
import type { Booking, Member, SharedThing } from '@/features/sharing/types';
import type { TableMapper } from '@/lib/cloud-sync';

const toMs = (value: unknown) => (value ? new Date(value as string).getTime() : undefined);
const toIso = (ms: number) => new Date(ms).toISOString();

export const itemMapper: TableMapper<Item> = {
  table: 'items',
  toRow: (item, household_id) => ({
    household_id,
    id: item.id,
    name: item.name,
    emoji: item.emoji,
    priority: item.priority,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    min_quantity: item.minQuantity,
    notes: item.notes,
    hidden_from: item.hiddenFrom,
    updated_at: toIso(item.updatedAt),
  }),
  fromRow: (row) => ({
    id: row.id as string,
    name: row.name as string,
    emoji: row.emoji as string,
    priority: row.priority as Item['priority'],
    category: row.category as string,
    quantity: Number(row.quantity),
    unit: row.unit as string,
    minQuantity: Number(row.min_quantity),
    notes: row.notes as string,
    hiddenFrom: (row.hidden_from as string[]) ?? [],
    updatedAt: toMs(row.updated_at) ?? Date.now(),
  }),
};

export const memberMapper: TableMapper<Member> = {
  table: 'members',
  // user_id is never sent: only the join/leave functions may change it.
  toRow: (m, household_id) => ({
    household_id,
    id: m.id,
    name: m.name,
    emoji: m.emoji,
    color: m.color,
    phone: m.phone,
    photo: m.photo ?? '',
  }),
  fromRow: (row) => ({
    id: row.id as string,
    name: row.name as string,
    emoji: row.emoji as string,
    color: row.color as string,
    phone: (row.phone as string) ?? '',
    userId: (row.user_id as string | null) ?? null,
    photo: (row.photo as string) ?? '',
  }),
};

export const thingMapper: TableMapper<SharedThing> = {
  table: 'things',
  toRow: (t, household_id) => ({ household_id, id: t.id, name: t.name, emoji: t.emoji }),
  fromRow: (row) => ({ id: row.id as string, name: row.name as string, emoji: row.emoji as string }),
};

export const bookingMapper: TableMapper<Booking> = {
  table: 'bookings',
  toRow: (b, household_id) => ({
    household_id,
    id: b.id,
    thing_id: b.thingId,
    member_id: b.memberId,
    start_at: toIso(b.start),
    end_at: toIso(b.end),
    purpose: b.purpose,
    returned_at: b.returnedAt ? toIso(b.returnedAt) : null,
    hidden_from: b.hiddenFrom ?? [],
  }),
  fromRow: (row) => ({
    id: row.id as string,
    thingId: (row.thing_id as string | null) ?? null,
    memberId: row.member_id as string,
    start: toMs(row.start_at)!,
    end: toMs(row.end_at)!,
    purpose: (row.purpose as string) ?? '',
    returnedAt: toMs(row.returned_at),
    hiddenFrom: (row.hidden_from as string[]) ?? [],
  }),
};
