import { StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useFamily } from '@/features/family/family-store';
import { useSharing } from '@/features/sharing/sharing-store';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

export const SURPRISE_COLOR = '#D6409F';

/** "🤫 Surprise · hidden from Dad" label. Renders nothing when not hidden from anyone. */
export function SurpriseTag({ hiddenFrom, compact }: { hiddenFrom?: string[]; compact?: boolean }) {
  const t = useT();
  const { members } = useSharing();
  if (!hiddenFrom?.length) return null;
  const names = hiddenFrom
    .map((id) => members.find((m) => m.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  return (
    <View style={[styles.tag, { backgroundColor: `${SURPRISE_COLOR}1F` }]}>
      <ThemedText style={styles.tagText} numberOfLines={1}>
        {compact ? '🤫' : t.surprise.hiddenFrom(names || t.common.someone)}
      </ThemedText>
    </View>
  );
}

type SurprisePickerProps = {
  value: string[];
  onChange: (hiddenFrom: string[]) => void;
  /** e.g. "Keep this a surprise" */
  title?: string;
  /** Member ids that can't be chosen (e.g. the author). */
  exclude?: string[];
};

/** Switch + "hide it from…" member chips. */
export function SurprisePicker({
  value,
  onChange,
  title,
  exclude = [],
}: SurprisePickerProps) {
  const theme = useTheme();
  const t = useT();
  const { members } = useSharing();
  const { meId } = useFamily();
  const enabled = value.length > 0;
  const choices = members.filter((m) => m.id !== meId && !exclude.includes(m.id));

  function toggle(on: boolean) {
    tapFeedback();
    onChange(on && choices[0] ? [choices[0].id] : []);
  }

  function toggleMember(id: string) {
    tapFeedback();
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id];
    onChange(next);
  }

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: enabled ? `${SURPRISE_COLOR}12` : theme.backgroundElement,
          borderColor: enabled ? SURPRISE_COLOR : 'transparent',
        },
      ]}>
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>🤫</ThemedText>
        <View style={styles.flex}>
          <ThemedText style={styles.title}>{title ?? t.itemForm.keepSurprise}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {enabled ? t.surprise.wontSee : t.surprise.hint}
          </ThemedText>
        </View>
        <Switch
          value={enabled}
          onValueChange={toggle}
          disabled={choices.length === 0}
          trackColor={{ true: SURPRISE_COLOR }}
          thumbColor="#ffffff"
        />
      </View>

      {enabled && (
        <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOut} style={styles.gap}>
          <ThemedText type="smallBold">{t.surprise.hideFrom}</ThemedText>
          <View style={styles.chips}>
            {choices.map((m) => {
              const selected = value.includes(m.id);
              return (
                <PressScale
                  key={m.id}
                  scaleTo={0.92}
                  onPress={() => toggleMember(m.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  style={[
                    styles.chip,
                    {
                      borderColor: selected ? SURPRISE_COLOR : theme.backgroundSelected,
                      backgroundColor: selected ? `${SURPRISE_COLOR}22` : theme.background,
                    },
                  ]}>
                  <MemberAvatar member={m} size={26} />
                  <ThemedText type="smallBold">{m.name}</ThemedText>
                  {selected && <ThemedText style={{ color: SURPRISE_COLOR }}>✓</ThemedText>}
                </PressScale>
              );
            })}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gap: {
    gap: Spacing.two,
  },
  tag: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
    color: SURPRISE_COLOR,
  },
  box: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.one,
    paddingRight: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    borderWidth: 1.5,
  },
});
