import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { guessEmoji } from './meta';
import { SAMPLE_ITEMS } from './sample-data';
import type { Item, ItemInput } from './types';

const STORAGE_KEY = 'inventory.items.v1';

let nextId = 0;
function makeId() {
  nextId += 1;
  return `${Date.now().toString(36)}-${nextId}`;
}

function fromInput(input: ItemInput): Item {
  return { ...input, id: makeId(), updatedAt: Date.now() };
}

function loadItems(): Item[] {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (raw) {
      // Older saves may lack newer fields; fill them in.
      return (JSON.parse(raw) as Partial<Item>[]).map((item) => ({
        ...(item as Item),
        emoji: item.emoji || guessEmoji(item.name ?? '', item.priority),
        notes: item.notes ?? '',
        category: item.category ?? '',
      }));
    }
  } catch (error) {
    console.warn('Failed to load inventory, using sample data', error);
  }
  return SAMPLE_ITEMS.map(fromInput);
}

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
  resetToSample: () => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(loadItems);

  useEffect(() => {
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function patch(id: string, update: (item: Item) => Partial<Item>) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...update(item), updatedAt: Date.now() } : item
      )
    );
  }

  const value: InventoryContextValue = {
    items,
    getItem: (id) => items.find((item) => item.id === id),
    addItem: (input) => setItems((prev) => [...prev, fromInput(input)]),
    updateItem: (id, input) => patch(id, () => input),
    removeItem: (id) => setItems((prev) => prev.filter((item) => item.id !== id)),
    restoreItem: (item) =>
      setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item])),
    adjustQuantity: (id, delta) =>
      patch(id, (item) => ({ quantity: Math.max(0, item.quantity + delta) })),
    setQuantity: (id, quantity) => patch(id, () => ({ quantity: Math.max(0, quantity) })),
    resetToSample: () => setItems(SAMPLE_ITEMS.map(fromInput)),
  };

  return <InventoryContext value={value}>{children}</InventoryContext>;
}

export function useInventory() {
  const ctx = use(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside <InventoryProvider>');
  return ctx;
}
