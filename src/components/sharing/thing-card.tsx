import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { ProgressBar } from '@/components/inventory/progress-bar';
import { ContactButtons } from '@/components/sharing/contact-buttons';
import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useSharing } from '@/features/sharing/sharing-store';
import {
  effectiveEnd,
  formatDay,
  formatDuration,
  formatTime,
  isActive,
  isUpcoming,
} from '@/features/sharing/time';
import type { SharedThing } from '@/features/sharing/types';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, successFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

const FREE = '#30A46C';
const BUSY = '#E5484D';

export function ThingCard({ thing, now }: { thing: SharedThing; now: number }) {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const { bookings, members, endBooking, snapshot, restore } = useSharing();

  const mine = bookings.filter((b) => b.thingId === thing.id);
  const active = mine.find((b) => isActive(b, now));
  const next = mine.filter((b) => isUpcoming(b, now)).sort((a, b) => a.start - b.start)[0];
  const user = active && members.find((m) => m.id === active.memberId);
  const nextUser = next && members.find((m) => m.id === next.memberId);

  function openBooking(mode: 'now' | 'plan') {
    pressFeedback();
    router.push({ pathname: '/plan/new', params: { thingId: thing.id, mode } });
  }

  function giveBack() {
    if (!active) return;
    const before = snapshot();
    successFeedback();
    endBooking(active.id);
    toast({
      message: `${thing.emoji} ${t.thing.freeAgain(thing.name)}`,
      actionLabel: t.common.undo,
      onAction: () => restore(before),
    });
  }

  return (
    <Animated.View
      entering={FadeIn}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.top}>
        <View
          style={[
            styles.icon,
            { backgroundColor: active ? `${BUSY}1A` : `${FREE}1A` },
          ]}>
          <ThemedText style={styles.iconEmoji}>{thing.emoji}</ThemedText>
        </View>

        <View style={styles.info}>
          <ThemedText style={styles.name}>{thing.name}</ThemedText>
          {active ? (
            <View style={styles.statusRow}>
              {user && <MemberAvatar member={user} size={22} />}
              <ThemedText type="small" style={{ color: BUSY }} numberOfLines={1}>
                {t.thing.inUseBy(user?.name ?? t.common.someone)}
              </ThemedText>
            </View>
          ) : (
            <ThemedText type="small" style={{ color: FREE }}>
              {t.thing.free}
            </ThemedText>
          )}
        </View>
      </View>

      {active && (
        <View style={styles.timeBlock}>
          <ProgressBar
            value={(now - active.start) / (effectiveEnd(active) - active.start)}
            color={BUSY}
            height={6}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {t.thing.until(
              formatTime(effectiveEnd(active)),
              formatDuration(effectiveEnd(active) - now)
            )}
            {active.purpose ? ` · ${active.purpose}` : ''}
          </ThemedText>
        </View>
      )}

      {active && user && (
        <ContactButtons
          member={user}
          compact
          message={t.thing.ask(user.name, thing.name)}
        />
      )}

      {next && (
        <ThemedText type="small" themeColor="textSecondary">
          {t.thing.next(
            nextUser ? `${nextUser.emoji} ${nextUser.name}` : t.common.someone,
            `${formatDay(next.start, now)} ${formatTime(next.start)}`
          )}
        </ThemedText>
      )}

      <View style={styles.actions}>
        {active ? (
          <PressScale
            onPress={giveBack}
            accessibilityRole="button"
            style={[styles.button, { backgroundColor: FREE }]}>
            <ThemedText style={styles.buttonText}>{t.thing.giveBack}</ThemedText>
          </PressScale>
        ) : (
          <PressScale
            onPress={() => openBooking('now')}
            accessibilityRole="button"
            style={[styles.button, styles.primary]}>
            <ThemedText style={styles.buttonText}>{t.thing.useNow}</ThemedText>
          </PressScale>
        )}
        <PressScale
          onPress={() => openBooking('plan')}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText style={styles.buttonTextDark}>{t.thing.plan}</ThemedText>
        </PressScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 30,
    lineHeight: 36,
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
  name: {
    fontSize: 18,
    fontWeight: 700,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeBlock: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 14,
  },
  primary: {
    backgroundColor: '#208AEF',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 700,
  },
  buttonTextDark: {
    fontWeight: 700,
  },
});
