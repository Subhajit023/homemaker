import { useEffect, useEffectEvent } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase';

type Row = Record<string, unknown>;

export type TableMapper<T> = {
  table: string;
  toRow: (value: T, householdId: string) => Row;
  fromRow: (row: Row) => T;
};

type Updater<T> = (prev: T[]) => T[];

/**
 * Keeps a list in sync with a Supabase table for one household:
 * loads it, then applies live inserts/updates/deletes from other phones.
 * Reloads when the app comes back to the foreground in case events were missed.
 */
export function useCloudTable<T extends { id: string }>(
  mapper: TableMapper<T>,
  householdId: string | null,
  apply: (updater: Updater<T>) => void
) {
  const onUpdate = useEffectEvent(apply);
  const { table, fromRow } = mapper;

  useEffect(() => {
    const client = supabase;
    if (!client || !householdId) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await client!.from(table).select('*').eq('household_id', householdId);
      if (error) {
        console.warn(`[sync] load ${table} failed`, error.message);
        return;
      }
      if (!cancelled) onUpdate(() => (data as Row[]).map(fromRow));
    }

    load();

    const channel = client
      .channel(`${table}:${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as Row).id;
            onUpdate((prev) => prev.filter((x) => x.id !== id));
          } else {
            const value = fromRow(payload.new as Row);
            onUpdate((prev) => upsertById(prev, value));
          }
        }
      )
      .subscribe();

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });

    return () => {
      cancelled = true;
      appState.remove();
      client.removeChannel(channel);
    };
  }, [table, fromRow, householdId]);
}

export function upsertById<T extends { id: string }>(list: T[], value: T) {
  const index = list.findIndex((x) => x.id === value.id);
  if (index === -1) return [...list, value];
  const next = [...list];
  next[index] = value;
  return next;
}

/** Downloads every row of a table for one household. Throws on failure. */
export async function cloudFetchAll<T>(mapper: TableMapper<T>, householdId: string): Promise<T[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(mapper.table)
    .select('*')
    .eq('household_id', householdId);
  if (error) throw new Error(error.message);
  return (data as Row[]).map(mapper.fromRow);
}

/** Writes rows to the cloud (insert or update). Errors are logged, not thrown. */
export async function cloudUpsert<T>(mapper: TableMapper<T>, householdId: string | null, values: T[]) {
  if (!supabase || !householdId || values.length === 0) return;
  const { error } = await supabase
    .from(mapper.table)
    .upsert(values.map((v) => mapper.toRow(v, householdId)), { onConflict: 'household_id,id' });
  if (error) console.warn(`[sync] save ${mapper.table} failed`, error.message);
}

export async function cloudDelete(table: string, householdId: string | null, ids: string[]) {
  if (!supabase || !householdId || ids.length === 0) return;
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('household_id', householdId)
    .in('id', ids);
  if (error) console.warn(`[sync] delete from ${table} failed`, error.message);
}

/** What changed between two versions of a list (used to sync "Undo"). */
export function diffById<T extends { id: string }>(current: T[], target: T[]) {
  const currentById = new Map(current.map((x) => [x.id, x]));
  const targetIds = new Set(target.map((x) => x.id));
  return {
    upserts: target.filter((x) => JSON.stringify(currentById.get(x.id)) !== JSON.stringify(x)),
    deletes: current.filter((x) => !targetIds.has(x.id)).map((x) => x.id),
  };
}

/** Random-enough id for rows created on this phone. */
export function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
