import type { ItemInput } from './types';

export const SAMPLE_ITEMS: ItemInput[] = [
  // Must-haves
  { emoji: '⚡', name: 'Electricity', priority: 1, category: 'Bills', quantity: 120, unit: 'kWh', minQuantity: 50, notes: 'Prepaid meter balance' },
  { emoji: '🔥', name: 'Cooking gas', priority: 1, category: 'Kitchen', quantity: 1, unit: 'cylinder', minQuantity: 2, notes: 'Keep one spare cylinder' },
  { emoji: '⛽', name: 'Petrol', priority: 1, category: 'Car & bike', quantity: 4, unit: 'L', minQuantity: 5, notes: '' },
  { emoji: '🥦', name: 'Vegetables', priority: 1, category: 'Kitchen', quantity: 2, unit: 'kg', minQuantity: 3, notes: '' },
  { emoji: '🍚', name: 'Rice', priority: 1, category: 'Kitchen', quantity: 10, unit: 'kg', minQuantity: 5, notes: '' },
  { emoji: '🥛', name: 'Milk', priority: 1, category: 'Kitchen', quantity: 0, unit: 'L', minQuantity: 2, notes: '' },

  // Home needs
  { emoji: '🛏️', name: 'Mattress', priority: 2, category: 'Bedroom', quantity: 2, unit: 'pcs', minQuantity: 2, notes: '' },
  { emoji: '🛏️', name: 'Bed sheets', priority: 2, category: 'Bedroom', quantity: 3, unit: 'sets', minQuantity: 4, notes: '' },
  { emoji: '🛋️', name: 'Sofa covers', priority: 2, category: 'Living room', quantity: 1, unit: 'sets', minQuantity: 2, notes: '' },
  { emoji: '🪟', name: 'Curtains', priority: 2, category: 'Living room', quantity: 6, unit: 'pcs', minQuantity: 6, notes: '' },
  { emoji: '🔌', name: 'Phone chargers', priority: 2, category: 'Gadgets', quantity: 3, unit: 'pcs', minQuantity: 2, notes: '' },

  // Special moments
  { emoji: '🎂', name: "Dad's birthday cake", priority: 3, category: 'Birthday', quantity: 0, unit: 'pcs', minQuantity: 1, notes: 'Order from the bakery a day before' },
  { emoji: '🎁', name: 'Anniversary present', priority: 3, category: 'Anniversary', quantity: 0, unit: 'pcs', minQuantity: 1, notes: 'Something special for my wife' },
];

/** One-tap templates on the "add item" screen. */
export const QUICK_ADD: ItemInput[] = [
  { emoji: '🥛', name: 'Milk', priority: 1, category: 'Kitchen', quantity: 0, unit: 'L', minQuantity: 2, notes: '' },
  { emoji: '🥚', name: 'Eggs', priority: 1, category: 'Kitchen', quantity: 0, unit: 'pcs', minQuantity: 6, notes: '' },
  { emoji: '🍞', name: 'Bread', priority: 1, category: 'Kitchen', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
  { emoji: '🫒', name: 'Cooking oil', priority: 1, category: 'Kitchen', quantity: 0, unit: 'L', minQuantity: 1, notes: '' },
  { emoji: '🌾', name: 'Flour', priority: 1, category: 'Kitchen', quantity: 0, unit: 'kg', minQuantity: 2, notes: '' },
  { emoji: '🍵', name: 'Tea', priority: 1, category: 'Kitchen', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
  { emoji: '💧', name: 'Drinking water', priority: 1, category: 'Kitchen', quantity: 0, unit: 'bottles', minQuantity: 2, notes: '' },
  { emoji: '🧼', name: 'Detergent', priority: 2, category: 'Cleaning', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
  { emoji: '🪥', name: 'Toothpaste', priority: 2, category: 'Bathroom', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
  { emoji: '🧻', name: 'Tissues', priority: 2, category: 'Bathroom', quantity: 0, unit: 'packets', minQuantity: 2, notes: '' },
  { emoji: '💡', name: 'Light bulbs', priority: 2, category: 'Gadgets', quantity: 0, unit: 'pcs', minQuantity: 2, notes: '' },
  { emoji: '💊', name: 'Medicines', priority: 1, category: 'Health', quantity: 0, unit: 'packets', minQuantity: 1, notes: '' },
  { emoji: '💐', name: 'Flowers', priority: 3, category: 'Gifts', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
  { emoji: '🎂', name: 'Birthday cake', priority: 3, category: 'Birthday', quantity: 0, unit: 'pcs', minQuantity: 1, notes: '' },
];
