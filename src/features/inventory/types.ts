export type Priority = 1 | 2 | 3;

export type StockStatus = 'out' | 'low' | 'ok';

export type Item = {
  id: string;
  name: string;
  /** Icon shown next to the item. */
  emoji: string;
  priority: Priority;
  category: string;
  /** Current amount on hand. */
  quantity: number;
  /** Unit the quantity is measured in, e.g. "kg", "L", "kWh", "pcs". */
  unit: string;
  /** Minimum amount to keep on hand. Below this the item needs restocking. */
  minQuantity: number;
  notes: string;
  /** Member ids this item is kept secret from (surprises). */
  hiddenFrom: string[];
  updatedAt: number;
};

export type ItemInput = Omit<Item, 'id' | 'updatedAt' | 'hiddenFrom'> & { hiddenFrom?: string[] };
