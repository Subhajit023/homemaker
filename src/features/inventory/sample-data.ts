import { strings } from '@/i18n';

import type { ItemInput } from './types';

type SampleKey = keyof ReturnType<typeof strings>['sample']['items'];

/** First-launch example items, in the current language. */
export function sampleItems(): ItemInput[] {
  const names = strings().sample.items;
  const item = (
    key: SampleKey,
    emoji: string,
    priority: ItemInput['priority'],
    quantity: number,
    unit: string,
    minQuantity: number,
    hiddenFrom?: string[]
  ): ItemInput => {
    const [name, category, notes] = names[key];
    return { emoji, name, category, notes, priority, quantity, unit, minQuantity, hiddenFrom };
  };
  return [
    // Must-haves
    item('electricity', '⚡', 1, 120, 'kWh', 50),
    item('gas', '🔥', 1, 1, 'cylinder', 2),
    item('petrol', '⛽', 1, 4, 'L', 5),
    item('vegetables', '🥦', 1, 2, 'kg', 3),
    item('rice', '🍚', 1, 10, 'kg', 5),
    item('milk', '🥛', 1, 0, 'L', 2),
    // Home needs
    item('mattress', '🛏️', 2, 2, 'pcs', 2),
    item('sheets', '🛏️', 2, 3, 'sets', 4),
    item('sofa', '🛋️', 2, 1, 'sets', 2),
    item('curtains', '🪟', 2, 6, 'pcs', 6),
    item('chargers', '🔌', 2, 3, 'pcs', 2),
    // Special moments (surprises)
    item('cake', '🎂', 3, 0, 'pcs', 1, ['m-dad']),
    item('present', '🎁', 3, 0, 'pcs', 1, ['m-wife']),
  ];
}
