import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useSharing } from '@/features/sharing/sharing-store';
import { DAY, formatTime, isActive, isUpcoming, startOfDay } from '@/features/sharing/time';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

/** Compact "who's using what + today's plans" strip for the Home screen. */
export function SharingSummary() {
  const theme = useTheme();
  const t = useT();
  const now = useNow();
  const { things, members, bookings } = useSharing();

  const endOfToday = startOfDay(now) + DAY;
  const todaysPlans = bookings
    .filter((b) => isUpcoming(b, now) && b.start < endOfToday)
    .sort((a, b) => a.start - b.start);
  const nextPlan = todaysPlans[0];
  const nextMember = nextPlan && members.find((m) => m.id === nextPlan.memberId);
  const nextThing = nextPlan?.thingId ? things.find((t) => t.id === nextPlan.thingId) : null;

  function open() {
    tapFeedback();
    router.navigate('/shared');
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.bleed}>
        {things.map((thing) => {
          const active = bookings.find((b) => b.thingId === thing.id && isActive(b, now));
          const user = active && members.find((m) => m.id === active.memberId);
          const color = active ? '#E5484D' : '#30A46C';
          return (
            <PressScale
              key={thing.id}
              scaleTo={0.94}
              onPress={open}
              style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.emoji}>{thing.emoji}</ThemedText>
              <View>
                <ThemedText type="smallBold" numberOfLines={1}>
                  {thing.name}
                </ThemedText>
                <ThemedText type="small" style={{ color }} numberOfLines={1}>
                  {active ? `${user?.emoji ?? ''} ${user?.name ?? t.summary.inUse}` : t.summary.free}
                </ThemedText>
              </View>
            </PressScale>
          );
        })}
      </ScrollView>

      <PressScale
        scaleTo={0.98}
        onPress={open}
        style={[styles.today, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={styles.todayEmoji}>🗓️</ThemedText>
        <View style={styles.flex}>
          <ThemedText style={styles.bold}>
            {todaysPlans.length === 0
              ? t.summary.noMorePlans
              : t.summary.laterToday(todaysPlans.length)}
          </ThemedText>
          {nextPlan && nextMember && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {t.summary.next(
                formatTime(nextPlan.start),
                nextMember.name,
                nextThing ? `${nextThing.emoji} ${nextThing.name}` : nextPlan.purpose
              )}
            </ThemedText>
          )}
        </View>
        <ThemedText themeColor="textSecondary">›</ThemedText>
      </PressScale>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: 700,
  },
  wrap: {
    gap: Spacing.two + Spacing.one,
  },
  bleed: {
    marginHorizontal: -Spacing.three,
  },
  row: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 16,
    minWidth: 130,
  },
  emoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  today: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
  },
  todayEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
});
