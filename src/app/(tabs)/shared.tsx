import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';

import { FamilyButton } from '@/components/family/family-button';
import { TabScreen } from '@/components/inventory/tab-screen';
import { BookingRow } from '@/components/sharing/booking-row';
import { ContactButtons } from '@/components/sharing/contact-buttons';
import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThingCard } from '@/components/sharing/thing-card';
import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useSharing } from '@/features/sharing/sharing-store';
import { DAY, formatDay, isActive, isUpcoming, startOfDay } from '@/features/sharing/time';
import type { Booking } from '@/features/sharing/types';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, tapFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

type PlanFilter = 'all' | 'shared' | 'personal';

const FILTERS: { key: PlanFilter; label: 'filterAll' | 'filterPersonal' | 'filterShared' }[] = [
  { key: 'all', label: 'filterAll' },
  { key: 'personal', label: 'filterPersonal' },
  { key: 'shared', label: 'filterShared' },
];

export default function PlanAndShareScreen() {
  const theme = useTheme();
  const t = useT();
  const now = useNow();
  const { members, things, bookings } = useSharing();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [filter, setFilter] = useState<PlanFilter>('all');

  const chosen = members.find((m) => m.id === selectedMember);

  // Upcoming plans (plus personal plans happening right now), grouped by day.
  const plans = bookings
    .filter((b) => isUpcoming(b, now) || (b.thingId === null && isActive(b, now)))
    .filter((b) =>
      filter === 'all' ? true : filter === 'personal' ? b.thingId === null : b.thingId !== null
    )
    .sort((a, b) => a.start - b.start);
  const days = new Map<number, Booking[]>();
  for (const plan of plans) {
    const day = startOfDay(Math.max(plan.start, now));
    if (day - startOfDay(now) > 14 * DAY) continue;
    days.set(day, [...(days.get(day) ?? []), plan]);
  }

  function newPlan(params: { thingId?: string; memberId?: string } = {}) {
    pressFeedback();
    router.push({ pathname: '/plan/new', params: { mode: 'plan', ...params } });
  }

  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <ThemedText style={styles.title}>{t.plan.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t.plan.subtitle}
            </ThemedText>
          </View>
          <FamilyButton />
          <PressScale
            scaleTo={0.9}
            accessibilityLabel={t.plan.manage}
            onPress={() => {
              tapFeedback();
              router.push('/plan/manage');
            }}
            style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.iconButtonText}>⚙️</ThemedText>
          </PressScale>
        </View>

        {/* Family */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t.plan.family}</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.familyRow}
            style={styles.bleed}>
            {members.map((member) => {
              const selected = member.id === selectedMember;
              return (
                <PressScale
                  key={member.id}
                  scaleTo={0.9}
                  onPress={() => {
                    tapFeedback();
                    setSelectedMember(selected ? null : member.id);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[styles.memberChip, selected && { backgroundColor: `${member.color}1F` }]}>
                  <MemberAvatar member={member} size={52} />
                  <ThemedText type="small" numberOfLines={1}>
                    {member.name}
                  </ThemedText>
                </PressScale>
              );
            })}
            <PressScale
              scaleTo={0.9}
              onPress={() => {
                tapFeedback();
                router.push('/plan/manage');
              }}
              style={styles.memberChip}>
              <View style={[styles.addAvatar, { borderColor: theme.textSecondary }]}>
                <ThemedText themeColor="textSecondary" style={styles.addAvatarText}>
                  ＋
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {t.plan.add}
              </ThemedText>
            </PressScale>
          </ScrollView>

          {chosen ? (
            <Animated.View
              key={chosen.id}
              entering={FadeInDown.springify().damping(18)}
              exiting={FadeOut.duration(150)}
              style={[styles.memberPanel, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.memberPanelTitle}>
                {chosen.emoji} {chosen.name}
              </ThemedText>
              <ContactButtons member={chosen} message={t.plan.hello(chosen.name)} />
              <PressScale
                onPress={() => newPlan({ memberId: chosen.id })}
                style={[styles.outlineButton, { borderColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">{t.plan.makePlanFor(chosen.name)}</ThemedText>
              </PressScale>
            </Animated.View>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              {t.plan.tapSomeone}
            </ThemedText>
          )}
        </View>

        {/* Shared things */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>{t.plan.sharedThings}</ThemedText>
          {things.length === 0 ? (
            <ThemedText themeColor="textSecondary">
              {t.plan.noThings}
            </ThemedText>
          ) : (
            things.map((thing) => <ThingCard key={thing.id} thing={thing} now={now} />)
          )}
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{t.plan.upcoming}</ThemedText>
            <PressScale
              scaleTo={0.92}
              onPress={() => newPlan()}
              accessibilityRole="button"
              style={styles.newPlanButton}>
              <ThemedText type="smallBold" style={styles.white}>
                {t.plan.newPlan}
              </ThemedText>
            </PressScale>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.bleed}>
            {FILTERS.map(({ key, label }) => {
              const selected = filter === key;
              return (
                <PressScale
                  key={key}
                  scaleTo={0.94}
                  onPress={() => {
                    tapFeedback();
                    setFilter(key);
                  }}
                  style={[
                    styles.filterChip,
                    { backgroundColor: selected ? theme.text : theme.backgroundElement },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={{ color: selected ? theme.background : theme.text }}>
                    {t.plan[label]}
                  </ThemedText>
                </PressScale>
              );
            })}
          </ScrollView>

          {days.size === 0 ? (
            <Animated.View entering={FadeIn} style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>🗓️</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                {t.plan.noPlans}
              </ThemedText>
            </Animated.View>
          ) : (
            [...days.entries()].map(([day, dayPlans]) => (
              <View key={day} style={styles.day}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {formatDay(day, now).toUpperCase()}
                </ThemedText>
                {dayPlans.map((plan) => (
                  <BookingRow key={plan.id} booking={plan} now={now} />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  white: {
    color: '#ffffff',
  },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: {
    fontSize: 20,
    lineHeight: 26,
  },
  bleed: {
    marginHorizontal: -Spacing.three,
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 700,
  },
  familyRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  memberChip: {
    alignItems: 'center',
    gap: Spacing.one,
    width: 76,
    paddingVertical: Spacing.two,
    borderRadius: 18,
  },
  addAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAvatarText: {
    fontSize: 22,
    lineHeight: 28,
  },
  memberPanel: {
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  memberPanelTitle: {
    fontSize: 17,
    fontWeight: 700,
  },
  outlineButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  newPlanButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  filterRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  day: {
    gap: Spacing.two,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  emptyEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
});
