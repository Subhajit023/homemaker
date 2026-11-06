import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { useFamily } from '@/features/family/family-store';
import { itemMapper } from '@/features/family/mappers';
import { cloudDelete, cloudUpsert, makeId, useCloudTable } from '@/lib/cloud-sync';
import { supabase } from '@/lib/supabase';

import { fromInput, inventoryKey, loadItems, saveItems } from './storage';
import type { Item, ItemInput } from './types';

const newId = () => makeId('i');

type InventoryContextValue = {
  items: Item[];
  getItem: (id: string) => Item | undefined;
  addItem: (input: ItemInput) => void;
  updateItem: (id: string, input: ItemInput) => void;
  removeItem: (id: string) => void;
  /** Puts a previously removed item back (for "Undo"). */
  restoreItem: (item: Item) => void;
  adjustQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantity: number) => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

/**
 * Items for the current home. Saved on the phone, and — once you're in a family —
 * synced live with everyone else through Supabase.
 */
export function InventoryProvider({ children }: { children: ReactNode }) {
  const { family } = useFamily();
  const hid = family?.householdId ?? null;
  const key = inventoryKey(hid);

  const [loadedKey, setLoadedKey] = useState(key);
  const [items, setItems] = useState<Item[]>(() => loadItems(key, newId));

  // Switched family (joined/left): show that family's cached items straight away.
  if (loadedKey !== key) {
    setLoadedKey(key);
    setItems(loadItems(key, newId));
  }

  useEffect(() => {
    if (loadedKey === key) saveItems(key, items);
  }, [items, key, loadedKey]);

  useCloudTable(itemMapper, hid, setItems);

  function save(item: Item) {
    cloudUpsert(itemMapper, hid, [item]);
  }

  function patch(id: string, update: (item: Item) => Partial<Item>) {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const next = { ...current, ...update(current), updatedAt: Date.now() };
    setItems((prev) => prev.map((item) => (item.id === id ? next : item)));
    return next;
  }

  // Surprises: never show this phone's member what's hidden from them.
  const me = family?.memberId;
  const visible = me ? items.filter((item) => !item.hiddenFrom.includes(me)) : items;

  const value: InventoryContextValue = {
    items: visible,
    getItem: (id) => visible.find((item) => item.id === id),
    addItem: (input) => {
      const item = fromInput(input, newId());
      setItems((prev) => [...prev, item]);
      save(item);
    },
    updateItem: (id, input) => {
      const next = patch(id, () => input);
      if (next) save(next);
    },
    removeItem: (id) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      cloudDelete(itemMapper.table, hid, [id]);
    },
    restoreItem: (item) => {
      setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));
      save(item);
    },
    adjustQuantity: (id, delta) => {
      // Functional update so quick repeated taps all count locally.
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta), updatedAt: Date.now() }
            : item
        )
      );
      // Atomic on the server so two people tapping at once both count.
      if (supabase && hid) {
        supabase
          .rpc('adjust_item_quantity', { p_household: hid, p_id: id, p_delta: delta })
          .then(({ error }) => {
            if (error) console.warn('[sync] adjust quantity failed', error.message);
          });
      }
    },
    setQuantity: (id, quantity) => {
      const next = patch(id, () => ({ quantity: Math.max(0, quantity) }));
      if (next) save(next);
    },
  };

  return <InventoryContext value={value}>{children}</InventoryContext>;
}

export function useInventory() {
  const ctx = use(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>');
  return ctx;
}
