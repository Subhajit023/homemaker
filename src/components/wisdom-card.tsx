import { router } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useBoard } from '@/features/board/board-store';
import { useFamily } from '@/features/family/family-store';
import type { Proverb, ProverbMood } from '@/i18n/content/types';
import { useContent, useT } from '@/i18n';
import { useTheme } from '@/hooks/use-theme';
import { successFeedback, tapFeedback } from '@/lib/haptics';

const GOLD = '#C27C0E';
const DAY_MS = 24 * 60 * 60 * 1000;

/** Picks the mood that fits the house: restock when things are low, praise when all is stocked. */
function moodFor(toBuy: number, day: number): ProverbMood {
  if (toBuy === 0) return 'stocked';
  if (toBuy >= 3) return 'restock';
  return day % 2 === 0 ? 'save' : 'family';
}

export function formatProverb(p: Proverb) {
  return `“${p.text}”${p.source ? ` — ${p.source}` : ''}`;
}

/** A proverb or folk-story line in the app's language, with its meaning and a household tip. */
export function WisdomCard({ toBuy }: { toBuy: number }) {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const { proverbs } = useContent();
  const { meId } = useFamily();
  const { addPost } = useBoard();
  const [offset, setOffset] = useState(0);

  // Same proverb all day; "Another" steps through the rest.
  const day = Math.floor(new Date().getTime() / DAY_MS);
  const mood = moodFor(toBuy, day);
  const pool = proverbs.filter((p) => p.mood === mood);
  const first = pool.length ? pool[day % pool.length] : proverbs[day % proverbs.length];
  const start = proverbs.indexOf(first);
  const proverb = proverbs[(start + offset) % proverbs.length];

  function share() {
    tapFeedback();
    Share.share({ message: `${formatProverb(proverb)}\n\n${proverb.meaning}` }).catch(() => {});
  }

  function post() {
    if (!meId) {
      toast({ message: t.board.chooseWhoFirst });
      router.navigate('/board');
      return;
    }
    successFeedback();
    addPost({ memberId: meId, text: `📜 ${formatProverb(proverb)}`, photo: '', hiddenFrom: [] });
    toast({ message: t.board.posted });
  }

  return (
    <View style={[styles.card, { backgroundColor: `${GOLD}12`, borderColor: `${GOLD}55` }]}>
      <ThemedText type="smallBold" style={styles.title}>
        📜 {t.home.wisdomTitle}
      </ThemedText>

      <Animated.View key={proverb.text} entering={FadeIn.duration(350)} style={styles.body}>
        <ThemedText style={styles.quoteMark}>“</ThemedText>
        <ThemedText style={styles.text}>{proverb.text}</ThemedText>
        {proverb.source ? (
          <ThemedText type="small" style={styles.source}>
            — {proverb.source}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          {proverb.meaning}
        </ThemedText>
        <View style={[styles.tip, { backgroundColor: theme.background }]}>
          <ThemedText type="small">💡 {proverb.tip}</ThemedText>
        </View>
      </Animated.View>

      <View style={styles.actions}>
        <SmallButton
          label={t.home.another}
          onPress={() => {
            tapFeedback();
            setOffset((o) => o + 1);
          }}
        />
        <SmallButton label={t.home.shareProverb} onPress={share} />
        <SmallButton label={t.home.postProverb} onPress={post} />
      </View>
    </View>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <PressScale
      scaleTo={0.92}
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.button, { backgroundColor: theme.background }]}>
      <ThemedText type="smallBold" numberOfLines={1}>
        {label}
      </ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    color: GOLD,
    letterSpacing: 0.5,
  },
  body: {
    gap: Spacing.two,
  },
  quoteMark: {
    color: GOLD,
    fontSize: 44,
    lineHeight: 44,
    height: 26,
    fontWeight: 800,
  },
  text: {
    fontSize: 19,
    lineHeight: 28,
    fontWeight: 700,
  },
  source: {
    color: GOLD,
    fontStyle: 'italic',
    fontWeight: 600,
  },
  tip: {
    borderRadius: 14,
    padding: Spacing.two + Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
});
