import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/i18n';
import { tapFeedback } from '@/lib/haptics';

/** Small "🌐 বাংলা" pill that opens the language picker. */
export function LanguageButton() {
  const theme = useTheme();
  const { t } = useLanguage();
  return (
    <PressScale
      scaleTo={0.92}
      onPress={() => {
        tapFeedback();
        router.push('/settings');
      }}
      accessibilityRole="button"
      accessibilityLabel={t.home.language}
      hitSlop={6}
      style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">🌐 {t.languageName}</ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.three,
  },
});
