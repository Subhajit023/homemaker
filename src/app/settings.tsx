import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PressScale } from '@/components/ui/press-scale';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES, useLanguage, type Lang } from '@/i18n';
import { successFeedback } from '@/lib/haptics';

const BLUE = '#208AEF';

export default function SettingsScreen() {
  const theme = useTheme();
  const { lang, setLang, t } = useLanguage();

  function choose(code: Lang) {
    if (code === lang) {
      router.back();
      return;
    }
    successFeedback();
    // The app re-draws in the new language (and returns to Home).
    setLang(code);
  }

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: t.settings.title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText themeColor="textSecondary">{t.settings.subtitle}</ThemedText>
        {LANGUAGES.map((language, index) => {
          const selected = language.code === lang;
          return (
            <Animated.View
              key={language.code}
              entering={FadeInDown.delay(index * 60).springify().damping(18)}>
              <PressScale
                scaleTo={0.97}
                onPress={() => choose(language.code)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={[
                  styles.option,
                  {
                    backgroundColor: selected ? `${BLUE}14` : theme.backgroundElement,
                    borderColor: selected ? BLUE : 'transparent',
                  },
                ]}>
                <View style={[styles.letter, { backgroundColor: selected ? BLUE : theme.backgroundSelected }]}>
                  <ThemedText style={[styles.letterText, selected && styles.white]}>
                    {language.letter}
                  </ThemedText>
                </View>
                <View style={styles.flex}>
                  <ThemedText style={styles.name}>{language.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {language.sample}
                  </ThemedText>
                </View>
                {selected && (
                  <Animated.View entering={ZoomIn.springify()} style={styles.check}>
                    <ThemedText style={styles.white}>✓</ThemedText>
                  </Animated.View>
                )}
              </PressScale>
            </Animated.View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  white: {
    color: '#ffffff',
    fontWeight: 700,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: 2,
  },
  letter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 700,
  },
  name: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
