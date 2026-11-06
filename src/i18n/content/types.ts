import type { ItemInput } from '@/features/inventory/types';

/** Which situation a proverb fits, so Home can pick one that matches the house. */
export type ProverbMood = 'restock' | 'save' | 'family' | 'stocked';

export type Proverb = {
  text: string;
  /** Plain explanation. */
  meaning: string;
  /** A practical household tip inspired by it. */
  tip: string;
  mood: ProverbMood;
  /** Poet, story or tradition it comes from, if any. */
  source?: string;
};

export type TemplateCategory = 'daily' | 'reminders' | 'wishes' | 'festivals';

/**
 * Culture-specific content written natively for each language (not word-for-word translations):
 * local groceries, festival greetings and proverbs.
 */
export type LanguageContent = {
  quickAdd: ItemInput[];
  templates: Record<TemplateCategory, string[]>;
  proverbs: Proverb[];
};
