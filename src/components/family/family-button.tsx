import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useFamily } from '@/features/family/family-store';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

function openFamily() {
  tapFeedback();
  router.push('/family');
}

/** Round 👨‍👩‍👧 button for screen headers; shows a green "live" dot when sharing. */
export function FamilyButton() {
  const theme = useTheme();
  const t = useT();
  const { family } = useFamily();
  return (
    <PressScale
      scaleTo={0.9}
      onPress={openFamily}
      accessibilityRole="button"
      accessibilityLabel={family ? t.familyButton.family(family.name) : t.familyButton.share}
      style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.emoji}>👨‍👩‍👧</ThemedText>
      {family && <View style={[styles.liveDot, { borderColor: theme.background }]} />}
    </PressScale>
  );
}

/** Home-screen nudge to invite the family (hidden once you're sharing). */
export function FamilyBanner() {
  const t = useT();
  const { family, isCloudConfigured } = useFamily();
  if (family || !isCloudConfigured) return null;
  return (
    <Animated.View entering={FadeInDown.delay(150).springify().damping(18)}>
      <PressScale scaleTo={0.98} onPress={openFamily} style={styles.banner}>
        <ThemedText style={styles.bannerEmoji}>👨‍👩‍👧‍👦</ThemedText>
        <View style={styles.flex}>
          <ThemedText style={styles.bannerTitle}>{t.familyButton.bannerTitle}</ThemedText>
          <ThemedText type="small" style={styles.bannerText}>
            {t.familyButton.bannerText}
          </ThemedText>
        </View>
        <ThemedText style={styles.bannerArrow}>›</ThemedText>
      </PressScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  liveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#30A46C',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
    backgroundColor: '#30A46C',
  },
  bannerEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  bannerTitle: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 16,
  },
  bannerText: {
    color: 'rgba(255,255,255,0.9)',
  },
  bannerArrow: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
  },
});
