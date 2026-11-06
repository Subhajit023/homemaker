import { strings } from '@/i18n';

import { addDays, atTime, HOUR, MINUTE, startOfDay } from './time';
import type { SharingState } from './types';

export const MEMBER_COLORS = ['#208AEF', '#E5484D', '#12A594', '#8E4EC6', '#E2860C', '#D6409F'];

export const MEMBER_EMOJIS = ['🧑', '👨', '👩', '👴', '👵', '👦', '👧', '🧒', '👶', '🧔', '👱', '🐶'];

export const THING_EMOJIS = [
  '🏍️', '🛵', '🚲', '🚗', '🚙', '🛺', '📺', '💻', '🎮', '📱', '🧺', '🔧', '🪜', '☂️', '📷', '🎧', '🧳', '🖨️', '🔌',
];

const THING_KEYWORDS: [RegExp, string][] = [
  [/motor ?bike|motorcycle|bullet|pulsar|\bbike\b|বাইক|बाइक/i, '🏍️'],
  [/scoot|activa|স্কুটি|स्कूटी/i, '🛵'],
  [/cycle|bicycle|সাইকেল|साइकिल/i, '🚲'],
  [/suv|jeep/i, '🚙'],
  [/car\b|গাড়ি|गाड़ी|कार/i, '🚗'],
  [/auto|rickshaw/i, '🛺'],
  [/tv|television|টিভি|टीवी/i, '📺'],
  [/laptop|computer|pc\b/i, '💻'],
  [/playstation|xbox|game/i, '🎮'],
  [/phone|tablet|ipad/i, '📱'],
  [/wash/i, '🧺'],
  [/tool|drill/i, '🔧'],
  [/ladder/i, '🪜'],
  [/umbrella/i, '☂️'],
  [/camera/i, '📷'],
  [/headphone|earphone|speaker/i, '🎧'],
  [/suitcase|luggage|bag/i, '🧳'],
  [/printer/i, '🖨️'],
];

/** Suggests an icon for a shared thing from its name, e.g. "Bike" → 🏍️. */
export function guessThingEmoji(name: string) {
  for (const [pattern, emoji] of THING_KEYWORDS) {
    if (pattern.test(name)) return emoji;
  }
  return null;
}

/** Starter family and things so the screen isn't empty on first launch. */
export function createSampleSharing(now = Date.now()): SharingState {
  const tomorrow = addDays(startOfDay(now), 1);
  const s = strings().sample;
  return {
    members: [
      { id: 'm-me', name: s.me, emoji: '🧑', color: MEMBER_COLORS[0], phone: '' },
      { id: 'm-wife', name: s.wife, emoji: '👩', color: MEMBER_COLORS[1], phone: '' },
      { id: 'm-dad', name: s.dad, emoji: '👴', color: MEMBER_COLORS[2], phone: '' },
    ],
    things: [
      { id: 't-scooty', name: s.scooty, emoji: '🛵' },
      { id: 't-tv', name: s.tv, emoji: '📺' },
      { id: 't-laptop', name: s.laptop, emoji: '💻' },
      { id: 't-washer', name: s.washer, emoji: '🧺' },
    ],
    bookings: [
      {
        id: 'b-1',
        thingId: 't-tv',
        memberId: 'm-dad',
        start: now - 30 * MINUTE,
        end: now + HOUR,
        purpose: s.news,
      },
      {
        id: 'b-2',
        thingId: 't-scooty',
        memberId: 'm-wife',
        start: atTime(tomorrow, 10, 0),
        end: atTime(tomorrow, 12, 0),
        purpose: s.market,
      },
      {
        id: 'b-3',
        thingId: 't-tv',
        memberId: 'm-me',
        start: atTime(tomorrow, 20, 0),
        end: atTime(tomorrow, 22, 0),
        purpose: s.cricket,
      },
      {
        id: 'b-4',
        thingId: null,
        memberId: 'm-dad',
        start: atTime(tomorrow, 17, 0),
        end: atTime(tomorrow, 18, 0),
        purpose: s.doctor,
      },
      {
        id: 'b-6',
        thingId: null,
        memberId: 'm-me',
        start: atTime(addDays(tomorrow, 2), 18, 0),
        end: atTime(addDays(tomorrow, 2), 19, 0),
        purpose: s.cakePlan,
        hiddenFrom: ['m-dad'],
      },
      {
        id: 'b-5',
        thingId: null,
        memberId: 'm-me',
        start: atTime(addDays(tomorrow, 1), 9, 0),
        end: atTime(addDays(tomorrow, 1), 9, 30),
        purpose: s.bill,
      },
    ],
  };
}
