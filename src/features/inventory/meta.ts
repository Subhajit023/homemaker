import type { Item, Priority, StockStatus } from './types';

export const PRIORITIES: Priority[] = [1, 2, 3];

export const PriorityMeta: Record<
  Priority,
  { label: string; emoji: string; description: string; color: string }
> = {
  1: {
    label: 'Must-haves',
    emoji: '⚡',
    description: 'Bills, fuel and daily food. Never let these run out.',
    color: '#208AEF',
  },
  2: {
    label: 'Home needs',
    emoji: '🛋️',
    description: 'Bedding, furnishing and gadgets around the house.',
    color: '#12A594',
  },
  3: {
    label: 'Special moments',
    emoji: '🎁',
    description: 'Birthdays, anniversaries, gifts and treats.',
    color: '#8E4EC6',
  },
};

export const StatusMeta: Record<StockStatus, { label: string; color: string }> = {
  out: { label: 'All gone', color: '#E5484D' },
  low: { label: 'Running low', color: '#E2860C' },
  ok: { label: 'Plenty', color: '#30A46C' },
};

export function getStatus(item: Pick<Item, 'quantity' | 'minQuantity'>): StockStatus {
  if (item.quantity >= item.minQuantity) return 'ok';
  return item.quantity <= 0 ? 'out' : 'low';
}

/** Status wording that reads naturally for the item (occasions are "to get"/"ready"). */
export function getStatusLabel(item: Item) {
  const status = getStatus(item);
  if (item.priority === 3) {
    if (status === 'ok') return 'Ready';
    if (status === 'out') return 'To get';
  }
  return StatusMeta[status].label;
}

/** 0–1 fill for a stock gauge. Half full = exactly at the minimum level. */
export function getStockLevel(item: Pick<Item, 'quantity' | 'minQuantity'>) {
  const target = Math.max(item.minQuantity * 2, 1);
  return Math.min(1, item.quantity / target);
}

const STATUS_ORDER: Record<StockStatus, number> = { out: 0, low: 1, ok: 2 };

/** Most urgent first: priority, then out before low before ok, then name. */
export function compareByUrgency(a: Item, b: Item) {
  return (
    a.priority - b.priority ||
    STATUS_ORDER[getStatus(a)] - STATUS_ORDER[getStatus(b)] ||
    a.name.localeCompare(b.name)
  );
}

/** Formats a number without trailing zeros, e.g. 2 → "2", 1.5 → "1.5". */
export function formatQty(value: number) {
  return String(Math.round(value * 100) / 100);
}

/** "2 kg", "1 cylinder" — unit omitted when it is the generic "pcs". */
export function formatAmount(value: number, unit: string) {
  return unit && unit !== 'pcs' ? `${formatQty(value)} ${unit}` : formatQty(value);
}

/** How much more to buy to get back to the minimum level. */
export function getShortfall(item: Item) {
  return Math.max(0, item.minQuantity - item.quantity);
}

export const COMMON_UNITS = ['pcs', 'kg', 'g', 'L', 'packets', 'bottles', 'sets', 'cylinder', 'kWh'];

export const EMOJI_CHOICES = [
  '⚡', '🔥', '⛽', '💧', '🥦', '🍅', '🥔', '🧅', '🍎', '🍌', '🍚', '🌾',
  '🥛', '🥚', '🍞', '🧈', '🫒', '🧂', '☕', '🍵', '🍪', '🧼', '🧴', '🪥',
  '🧻', '🧺', '💊', '🛏️', '🛋️', '🪟', '🔌', '💡', '🔋', '📱', '🎂', '🎁',
  '💐', '🎉', '👕', '👟', '🐶', '📦',
];

const EMOJI_KEYWORDS: [RegExp, string][] = [
  [/electric|power|meter/i, '⚡'],
  [/gas|lpg|cylinder/i, '🔥'],
  [/petrol|diesel|fuel/i, '⛽'],
  [/water/i, '💧'],
  [/vegetable|veggie|sabzi/i, '🥦'],
  [/tomato/i, '🍅'],
  [/potato/i, '🥔'],
  [/onion/i, '🧅'],
  [/fruit|apple/i, '🍎'],
  [/banana/i, '🍌'],
  [/rice/i, '🍚'],
  [/flour|atta|wheat|dal|lentil/i, '🌾'],
  [/milk/i, '🥛'],
  [/egg/i, '🥚'],
  [/bread/i, '🍞'],
  [/butter|ghee/i, '🧈'],
  [/oil/i, '🫒'],
  [/salt|spice|masala/i, '🧂'],
  [/coffee/i, '☕'],
  [/tea/i, '🍵'],
  [/biscuit|snack|cookie/i, '🍪'],
  [/soap|detergent|wash/i, '🧼'],
  [/shampoo|lotion/i, '🧴'],
  [/tooth/i, '🪥'],
  [/tissue|toilet/i, '🧻'],
  [/medicine|tablet|pill/i, '💊'],
  [/mattress|bed|sheet|pillow|blanket/i, '🛏️'],
  [/sofa|cushion/i, '🛋️'],
  [/curtain|window/i, '🪟'],
  [/charger|cable|plug/i, '🔌'],
  [/bulb|light/i, '💡'],
  [/battery/i, '🔋'],
  [/phone/i, '📱'],
  [/cake|birthday/i, '🎂'],
  [/gift|present|anniversary/i, '🎁'],
  [/flower/i, '💐'],
  [/party|celebrat/i, '🎉'],
];

export function guessEmoji(name: string, priority: Priority = 1) {
  for (const [pattern, emoji] of EMOJI_KEYWORDS) {
    if (pattern.test(name)) return emoji;
  }
  return priority === 3 ? '🎁' : '📦';
}
