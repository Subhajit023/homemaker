import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

import { SurprisePicker } from '@/components/family/surprise';
import { ContactButtons } from '@/components/sharing/contact-buttons';
import { MemberAvatar } from '@/components/sharing/member-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSharing } from '@/features/sharing/sharing-store';
import {
  addDays,
  atTime,
  DURATIONS,
  findConflict,
  formatDay,
  formatRange,
  formatTime,
  MINUTE,
  startOfDay,
} from '@/features/sharing/time';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, successFeedback, tapFeedback, warningFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

type Mode = 'now' | 'plan';

/** Half-hour start times from 6:00 AM to 11:30 PM, as minutes after midnight. */
const SLOTS = Array.from({ length: 36 }, (_, i) => 6 * 60 + i * 30);
const DAYS_AHEAD = 7;

function availableSlots(dayOffset: number, now: number) {
  if (dayOffset > 0) return SLOTS;
  const minutesNow = (now - startOfDay(now)) / MINUTE;
  return SLOTS.filter((slot) => slot > minutesNow);
}

function slotLabel(slot: number) {
  return formatTime(atTime(startOfDay(Date.now()), Math.floor(slot / 60), slot % 60));
}

export default function NewPlanScreen() {
  const params = useLocalSearchParams<{ thingId?: string; memberId?: string; mode?: Mode }>();
  const { members, things, bookings, addBooking } = useSharing();
  const theme = useTheme();
  const toast = useToast();
  const t = useT();
  const now = useNow();

  const [thingId, setThingId] = useState<string | null>(
    () => things.find((t) => t.id === params.thingId)?.id ?? null
  );
  const [memberId, setMemberId] = useState(
    () => members.find((m) => m.id === params.memberId)?.id ?? members[0]?.id ?? ''
  );
  const [mode, setMode] = useState<Mode>(params.mode === 'now' && params.thingId ? 'now' : 'plan');
  const [dayOffset, setDayOffset] = useState(() => (availableSlots(0, Date.now()).length ? 0 : 1));
  const [slot, setSlot] = useState(() => availableSlots(dayOffset, Date.now())[0] ?? SLOTS[0]);
  const [duration, setDuration] = useState(60);
  const [purpose, setPurpose] = useState('');
  const [hiddenFrom, setHiddenFrom] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const thing = things.find((t) => t.id === thingId) ?? null;
  const member = members.find((m) => m.id === memberId);
  const personal = thing === null;
  const effectiveMode: Mode = personal ? 'plan' : mode;
  const slots = availableSlots(dayOffset, now);
  const day = addDays(startOfDay(now), dayOffset);
  const start =
    effectiveMode === 'now' ? now : atTime(day, Math.floor(slot / 60), slot % 60);
  const end = start + duration * MINUTE;
  const conflict = findConflict(bookings, thingId, start, end);
  const conflictMember = conflict && members.find((m) => m.id === conflict.memberId);

  if (members.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: t.planForm.newPlan }} />
        <ThemedText style={styles.bigEmoji}>👨‍👩‍👧</ThemedText>
        <ThemedText themeColor="textSecondary">{t.planForm.addFamilyFirst}</ThemedText>
        <PressScale onPress={() => router.replace('/plan/manage')} style={styles.primaryButton}>
          <ThemedText style={styles.primaryText}>{t.planForm.addFamily}</ThemedText>
        </PressScale>
      </ThemedView>
    );
  }

  function pickDay(offset: number) {
    tapFeedback();
    setDayOffset(offset);
    const options = availableSlots(offset, now);
    if (!options.includes(slot)) setSlot(options[0] ?? SLOTS[0]);
    setError(null);
  }

  function save() {
    if (!member) return fail(t.planForm.errWho);
    if (personal && !purpose.trim()) return fail(t.planForm.errWhat);
    if (effectiveMode === 'plan' && slots.length === 0) return fail(t.planForm.errDay);

    const result = addBooking({
      thingId,
      memberId: member.id,
      start,
      end,
      purpose: purpose.trim(),
      // A plan can't be a secret from the person it's for.
      hiddenFrom: hiddenFrom.filter((id) => id !== member.id),
    });
    if (!result.ok) return fail(t.planForm.errClash);

    successFeedback();
    toast({
      message:
        effectiveMode === 'now' && thing
          ? `${thing.emoji} ${t.planForm.nowUsing(member.name, thing.name)}`
          : t.planForm.saved(member.name, `${formatDay(start, now)} ${formatTime(start)}`),
    });
    router.back();
  }

  function fail(message: string) {
    warningFeedback();
    setError(message);
  }

  const title = personal
    ? t.planForm.newPlan
    : effectiveMode === 'now'
      ? t.planForm.use(thing.name)
      : t.planForm.plan(thing.name);

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title }} />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* What is the plan about */}
          <Section title={t.planForm.whatAbout}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              style={styles.bleed}>
              <BigChip
                emoji="🙋"
                label={t.planForm.personal}
                selected={personal}
                onPress={() => {
                  setThingId(null);
                  setError(null);
                }}
              />
              {things.map((t) => (
                <BigChip
                  key={t.id}
                  emoji={t.emoji}
                  label={t.name}
                  selected={t.id === thingId}
                  onPress={() => {
                    setThingId(t.id);
                    setError(null);
                  }}
                />
              ))}
            </ScrollView>
          </Section>

          <Section title={personal ? t.planForm.whosePlan : t.planForm.whoUses}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              style={styles.bleed}>
              {members.map((m) => {
                const selected = m.id === memberId;
                return (
                  <PressScale
                    key={m.id}
                    scaleTo={0.9}
                    onPress={() => {
                      tapFeedback();
                      setMemberId(m.id);
                      setError(null);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[
                      styles.memberChip,
                      {
                        borderColor: selected ? m.color : 'transparent',
                        backgroundColor: selected ? `${m.color}1A` : theme.backgroundElement,
                      },
                    ]}>
                    <MemberAvatar member={m} size={44} />
                    <ThemedText type="small" numberOfLines={1}>
                      {m.name}
                    </ThemedText>
                  </PressScale>
                );
              })}
            </ScrollView>
          </Section>

          <Section
            title={personal ? t.planForm.whatsPlan : t.planForm.whatFor}
            hint={personal ? undefined : t.common.optional}>
            <TextInput
              value={purpose}
              onChangeText={(v) => {
                setPurpose(v);
                setError(null);
              }}
              placeholder={
                personal ? t.planForm.personalPlaceholder : t.planForm.sharedPlaceholder
              }
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </Section>

          {!personal && (
            <Section title={t.planForm.when}>
              <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
                {(['now', 'plan'] as const).map((m) => {
                  const selected = mode === m;
                  return (
                    <PressScale
                      key={m}
                      scaleTo={0.96}
                      onPress={() => {
                        tapFeedback();
                        setMode(m);
                        setError(null);
                      }}
                      style={[styles.segmentItem, selected && { backgroundColor: theme.background }]}>
                      <ThemedText type="smallBold" themeColor={selected ? 'text' : 'textSecondary'}>
                        {m === 'now' ? t.planForm.rightNow : t.planForm.later}
                      </ThemedText>
                    </PressScale>
                  );
                })}
              </View>
            </Section>
          )}

          {effectiveMode === 'plan' && (
            <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.section}>
              <Section title={personal ? t.planForm.when : t.planForm.whichDay}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                  style={styles.bleed}>
                  {Array.from({ length: DAYS_AHEAD }, (_, offset) => {
                    const d = addDays(startOfDay(now), offset);
                    const disabled = availableSlots(offset, now).length === 0;
                    return (
                      <Chip
                        key={offset}
                        label={formatDay(d, now)}
                        selected={offset === dayOffset}
                        disabled={disabled}
                        onPress={() => pickDay(offset)}
                      />
                    );
                  })}
                </ScrollView>
              </Section>
              <Section title={t.planForm.startTime}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                  style={styles.bleed}>
                  {slots.map((s) => (
                    <Chip
                      key={s}
                      label={slotLabel(s)}
                      selected={s === slot}
                      onPress={() => {
                        tapFeedback();
                        setSlot(s);
                        setError(null);
                      }}
                    />
                  ))}
                </ScrollView>
              </Section>
            </Animated.View>
          )}

          <Section title={t.planForm.howLong}>
            <View style={styles.wrapRow}>
              {DURATIONS.map((minutes, i) => (
                <Chip
                  key={minutes}
                  label={t.time.durations[i]}
                  selected={minutes === duration}
                  onPress={() => {
                    tapFeedback();
                    setDuration(minutes);
                    setError(null);
                  }}
                />
              ))}
            </View>
          </Section>

          <SurprisePicker
            title={t.surprise.planTitle}
            value={hiddenFrom.filter((id) => id !== memberId)}
            onChange={setHiddenFrom}
            exclude={[memberId]}
          />

          {/* Summary */}
          {member && (
            <Animated.View
              layout={LinearTransition}
              style={[
                styles.summary,
                {
                  backgroundColor: conflict ? '#E5484D1A' : `${member.color}14`,
                  borderColor: conflict ? '#E5484D' : member.color,
                },
              ]}>
              <ThemedText style={styles.summaryText}>
                {member.emoji} <ThemedText style={styles.bold}>{member.name}</ThemedText>
                {personal
                  ? ` · ${purpose.trim() || t.booking.personalPlan}`
                  : t.planForm.willUse(`${thing.emoji} ${thing.name}`)}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                🕑 {effectiveMode === 'now' ? t.planForm.now : formatDay(start, now)},{' '}
                {formatRange(start, end)}
              </ThemedText>
              {conflict && (
                <Animated.View entering={FadeIn} style={styles.conflict}>
                  <ThemedText style={styles.conflictText}>
                    {t.planForm.alreadyBooked(
                      conflictMember?.name ?? t.common.someone,
                      formatRange(conflict.start, conflict.returnedAt ?? conflict.end)
                    )}
                  </ThemedText>
                  {conflictMember && conflictMember.id !== member.id && (
                    <ContactButtons
                      member={conflictMember}
                      compact
                      message={t.planForm.askToUse(
                        conflictMember.name,
                        thing?.name ?? '',
                        formatDay(start, now),
                        formatTime(start)
                      )}
                    />
                  )}
                </Animated.View>
              )}
            </Animated.View>
          )}

          {error && (
            <Animated.View entering={FadeIn} style={styles.error}>
              <ThemedText style={styles.errorText}>⚠️ {error}</ThemedText>
            </Animated.View>
          )}

          <PressScale
            onPress={() => {
              pressFeedback();
              save();
            }}
            accessibilityRole="button"
            style={[styles.primaryButton, conflict && styles.disabled]}>
            <ThemedText style={styles.primaryText}>
              {effectiveMode === 'now' ? t.planForm.startUsing : t.planForm.save}
            </ThemedText>
          </PressScale>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );
}

function BigChip({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <PressScale
      scaleTo={0.92}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        styles.bigChip,
        {
          borderColor: selected ? '#208AEF' : 'transparent',
          backgroundColor: selected ? '#208AEF1A' : theme.backgroundElement,
        },
      ]}>
      <ThemedText style={styles.bigChipEmoji}>{emoji}</ThemedText>
      <ThemedText type="small" numberOfLines={1}>
        {label}
      </ThemedText>
    </PressScale>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <PressScale
      scaleTo={0.92}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.chip,
        { backgroundColor: selected ? theme.text : theme.backgroundElement },
        disabled && styles.disabled,
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: 700,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  bigEmoji: {
    fontSize: 56,
    lineHeight: 64,
  },
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  bleed: {
    marginHorizontal: -Spacing.three,
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  chipRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  bigChip: {
    alignItems: 'center',
    width: 92,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 16,
    borderWidth: 2,
    gap: Spacing.one,
  },
  bigChipEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  memberChip: {
    alignItems: 'center',
    width: 84,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 16,
    borderWidth: 2,
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
    borderRadius: Spacing.four,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 16,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: Spacing.one,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 12,
  },
  summary: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  summaryText: {
    fontSize: 17,
  },
  conflict: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  conflictText: {
    color: '#E5484D',
    fontWeight: 600,
  },
  error: {
    backgroundColor: '#E5484D1A',
    padding: Spacing.three,
    borderRadius: 16,
  },
  errorText: {
    color: '#E5484D',
  },
  primaryButton: {
    backgroundColor: '#208AEF',
    alignItems: 'center',
    paddingVertical: Spacing.three + Spacing.one,
    paddingHorizontal: Spacing.four,
    borderRadius: 18,
    boxShadow: '0 6px 16px rgba(32,138,239,0.35)',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 17,
  },
  disabled: {
    opacity: 0.4,
  },
});
