import { getLocales } from 'expo-localization';
import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useState, type ReactNode } from 'react';

import { bn } from './bn';
import { bnContent } from './content/bn';
import { enContent } from './content/en';
import { hiContent } from './content/hi';
import type { LanguageContent } from './content/types';
import { en, type Strings } from './en';
import { hi } from './hi';

export type Lang = 'en' | 'bn' | 'hi';

export const LANGUAGES: { code: Lang; name: string; sample: string; letter: string }[] = [
  { code: 'en', name: 'English', sample: 'Good morning 👋', letter: 'A' },
  { code: 'bn', name: 'বাংলা', sample: 'সুপ্রভাত 👋', letter: 'অ' },
  { code: 'hi', name: 'हिन्दी', sample: 'सुप्रभात 👋', letter: 'अ' },
];

const STRINGS: Record<Lang, Strings> = { en, bn, hi };
const CONTENT: Record<Lang, LanguageContent> = { en: enContent, bn: bnContent, hi: hiContent };
/** Locale for dates and times (Indian regional formats). */
const LOCALES: Record<Lang, string> = { en: 'en-IN', bn: 'bn-IN', hi: 'hi-IN' };
const STORAGE_KEY = 'lang.v1';

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'bn' || value === 'hi';
}

/** Saved choice, else the phone's language if we support it, else English. */
function initialLang(): Lang {
  try {
    const saved = Storage.getItemSync(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {}
  const device = getLocales()[0]?.languageCode;
  return isLang(device) ? device : 'en';
}

let current: Lang = initialLang();

/** Current strings, for code outside components (formatters, sample data). */
export function strings(): Strings {
  return STRINGS[current];
}

/** Current locale for `toLocale…String`. */
export function locale() {
  return LOCALES[current];
}

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Strings;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  function setLang(next: Lang) {
    current = next;
    Storage.setItemSync(STORAGE_KEY, next);
    setLangState(next);
  }

  return <LanguageContext value={{ lang, setLang, t: STRINGS[lang] }}>{children}</LanguageContext>;
}

export function useLanguage() {
  const ctx = use(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}

/** Current language without requiring the provider (falls back to the saved choice). */
export function useCurrentLang(): Lang {
  return use(LanguageContext)?.lang ?? current;
}

/** Translated strings for the current language. */
export function useT() {
  return useLanguage().t;
}

/** Native templates, groceries and proverbs for the current language. */
export function useContent() {
  return CONTENT[useLanguage().lang];
}
