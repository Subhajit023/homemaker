import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { SurpriseTag } from '@/components/family/surprise';
import { ContactButtons } from '@/components/sharing/contact-buttons';
import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useSharing } from '@/features/sharing/sharing-store';
import { formatDay, formatRange, isActive } from '@/features/sharing/time';
import type { Booking } from '@/features/sharing/types';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback, warningFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

/** One plan: who, what, when. Tap to call / message the person; ✕ to cancel. */
export function BookingRow({ booking, now }: { booking: Booking; now: number }) {
  const theme = useTheme();
  const t = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { members, things, cancelBooking, snapshot, restore } = useSharing();
  const member = members.find((m) => m.id === booking.memberId);
  const thing = booking.thingId ? things.find((t) => t.id === booking.thingId) : null;
  if (!member || thing === undefined) return null;

  const personal = thing === null;
  const title = personal
    ? booking.purpose || t.booking.personalPlan
    : `${thing.emoji} ${thing.name}${booking.purpose ? ` · ${booking.purpose}` : ''}`;
  const when = `${formatDay(booking.start, now)}, ${formatRange(booking.start, booking.end)}`;
  const live = isActive(booking, now);

  function cancel() {
    const before = snapshot();
    warningFeedback();
    cancelBooking(booking.id);
    toast({
      message: t.booking.cancelled(member!.name, title),
      actionLabel: t.common.undo,
      onAction: () => restore(before),
    });
  }

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOutLeft.duration(250)}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.colorBar, { backgroundColor: member.color }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <PressScale
            scaleTo={0.98}
            style={styles.main}
            accessibilityHint={t.booking.showContact}
            onPress={() => {
              tapFeedback();
              setOpen((v) => !v);
            }}>
            <MemberAvatar member={member} size={40} />
            <View style={styles.info}>
              <ThemedText style={styles.title} numberOfLines={1}>
                {title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {member.name} · {personal ? t.booking.personal : t.booking.shared}
              </ThemedText>
              <ThemedText type="small" style={live ? styles.live : undefined} themeColor="textSecondary">
                {live ? t.booking.now : `🕑 ${when}`}
              </ThemedText>
              <SurpriseTag hiddenFrom={booking.hiddenFrom} />
            </View>
          </PressScale>
          <Pressable
            onPress={cancel}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.booking.cancel}
            style={[styles.cancel, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText themeColor="textSecondary" style={styles.cancelText}>
              ✕
            </ThemedText>
          </Pressable>
        </View>

        {open && (
          <Animated.View entering={FadeInDown.springify().damping(18)}>
            <ContactButtons
              member={member}
              compact
              message={t.booking.reminder(title, when)}
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
  },
  colorBar: {
    width: 5,
  },
  body: {
    flex: 1,
    padding: Spacing.three,
    paddingLeft: Spacing.three - 2,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontWeight: 700,
  },
  live: {
    color: '#E5484D',
    fontWeight: 700,
  },
  cancel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
  },
});
