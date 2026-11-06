import Storage from 'expo-sqlite/kv-store';

import { guessEmoji } from './meta';
import { sampleItems } from './sample-data';
import type { Item, ItemInput } from './types';

/** Local (not shared) data lives under the original key; each family gets its own cache. */
export function inventoryKey(householdId: string | null) {
  return householdId ? `inventory.items.${householdId}` : 'inventory.items.v1';
}

export function fromInput(input: ItemInput, id: string): Item {
  return { ...input, hiddenFrom: input.hiddenFrom ?? [], id, updatedAt: Date.now() };
}

/** Reads saved items. Local mode falls back to sample data; a family cache starts empty. */
export function loadItems(key: string, makeId: () => string): Item[] {
  try {
    const raw = Storage.getItemSync(key);
    if (raw) {
      // Older saves may lack newer fields; fill them in.
      return (JSON.parse(raw) as Partial<Item>[]).map((item) => ({
        ...(item as Item),
        emoji: item.emoji || guessEmoji(item.name ?? '', item.priority),
        notes: item.notes ?? '',
        category: item.category ?? '',
        hiddenFrom: item.hiddenFrom ?? [],
      }));
    }
  } catch (error) {
    console.warn('Failed to load inventory', error);
  }
  return key === inventoryKey(null) ? sampleItems().map((input) => fromInput(input, makeId())) : [];
}

export function saveItems(key: string, items: Item[]) {
  Storage.setItemSync(key, JSON.stringify(items));
}
