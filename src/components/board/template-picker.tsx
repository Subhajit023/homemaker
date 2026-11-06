import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { formatProverb } from '@/components/wisdom-card';
import { Spacing } from '@/constants/theme';
import type { TemplateCategory } from '@/i18n/content/types';
import { useContent, useT } from '@/i18n';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';

type Category = TemplateCategory | 'proverbs';
const CATEGORIES: Category[] = ['daily', 'reminders', 'wishes', 'festivals', 'proverbs'];

/** Category tabs + one-tap message templates written natively for the current language. */
export function TemplatePicker({ onPick }: { onPick: (text: string) => void }) {
  const theme = useTheme();
  const t = useT();
  const { templates, proverbs } = useContent();
  const [category, setCategory] = useState<Category>('daily');

  const options =
    category === 'proverbs'
      ? proverbs.map((p) => `📜 ${formatProverb(p)}`)
      : templates[category];

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CATEGORIES.map((key) => {
          const selected = key === category;
          return (
            <PressScale
              key={key}
              scaleTo={0.92}
              onPress={() => {
                tapFeedback();
                setCategory(key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[
                styles.tab,
                { backgroundColor: selected ? theme.text : theme.background },
              ]}>
              <ThemedText
                type="smallBold"
                style={{ color: selected ? theme.background : theme.textSecondary }}>
                {t.board.templates[key]}
              </ThemedText>
            </PressScale>
          );
        })}
      </ScrollView>

      <Animated.View key={category} entering={FadeIn.duration(200)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {options.map((text) => (
            <PressScale
              key={text}
              scaleTo={0.94}
              onPress={() => {
                tapFeedback();
                onPick(text);
              }}
              style={[styles.template, { backgroundColor: theme.background }]}>
              <ThemedText type="small" numberOfLines={3}>
                {text}
              </ThemedText>
            </PressScale>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  row: {
    gap: Spacing.two,
  },
  tab: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Spacing.four,
  },
  template: {
    maxWidth: 220,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 16,
  },
});
