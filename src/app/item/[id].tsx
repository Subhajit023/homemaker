import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, ZoomIn } from 'react-native-reanimated';

import { ItemAvatar } from '@/components/inventory/pill';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useInventory } from '@/features/inventory/inventory-store';
import {
  COMMON_UNITS,
  EMOJI_CHOICES,
  formatQty,
  guessEmoji,
  PRIORITIES,
  PriorityMeta,
  StatusMeta,
} from '@/features/inventory/meta';
import { QUICK_ADD } from '@/features/inventory/sample-data';
import type { Item, ItemInput, Priority } from '@/features/inventory/types';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, successFeedback, tapFeedback, warningFeedback } from '@/lib/haptics';

type FormState = {
  name: string;
  emoji: string;
  priority: Priority;
  category: string;
  quantity: string;
  unit: string;
  minQuantity: string;
  notes: string;
};

function toForm(item: Item | ItemInput | undefined): FormState {
  return {
    name: item?.name ?? '',
    emoji: item?.emoji ?? '📦',
    priority: item?.priority ?? 1,
    category: item?.category ?? '',
    quantity: item ? formatQty(item.quantity) : '0',
    unit: item?.unit ?? 'pcs',
    minQuantity: item ? formatQty(item.minQuantity) : '1',
    notes: item?.notes ?? '',
  };
}

function parseAmount(value: string) {
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getItem, addItem, updateItem, removeItem, restoreItem } = useInventory();
  const theme = useTheme();
  const toast = useToast();

  const isNew = id === 'new';
  const existing = isNew ? undefined : getItem(id);
  const [form, setForm] = useState<FormState>(() => toForm(existing));
  const [emojiPicked, setEmojiPicked] = useState(!isNew);
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isNew && !existing) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <ThemedText style={styles.bigEmoji}>🤷</ThemedText>
        <ThemedText themeColor="textSecondary">This item has been removed.</ThemedText>
      </ThemedView>
    );
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function setName(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      // Suggest an icon from the name until the user picks one themselves.
      emoji: emojiPicked ? prev.emoji : guessEmoji(name, prev.priority),
    }));
    setError(null);
  }

  function step(key: 'quantity' | 'minQuantity', delta: number) {
    tapFeedback();
    const current = parseAmount(form[key]) ?? 0;
    set(key, formatQty(Math.max(0, current + delta)));
  }

  function applyPreset(preset: ItemInput) {
    tapFeedback();
    setForm(toForm(preset));
    setEmojiPicked(true);
    setError(null);
  }

  function save() {
    const name = form.name.trim();
    const quantity = parseAmount(form.quantity);
    const minQuantity = parseAmount(form.minQuantity);
    if (!name) return fail('Please give it a name, e.g. “Milk”.');
    if (quantity === null) return fail('“How much do you have” should be a number.');
    if (minQuantity === null) return fail('“Remind me below” should be a number.');

    const input: ItemInput = {
      name,
      emoji: form.emoji,
      priority: form.priority,
      category: form.category.trim(),
      quantity,
      unit: form.unit.trim() || 'pcs',
      minQuantity,
      notes: form.notes.trim(),
    };
    if (existing) updateItem(existing.id, input);
    else addItem(input);
    successFeedback();
    toast({ message: `${input.emoji} ${input.name} ${existing ? 'updated' : 'added to your home'}` });
    router.back();
  }

  function fail(message: string) {
    warningFeedback();
    setError(message);
  }

  function remove() {
    if (!existing) return;
    warningFeedback();
    removeItem(existing.id);
    router.back();
    toast({
      message: `${existing.emoji} ${existing.name} removed`,
      actionLabel: 'Undo',
      onAction: () => restoreItem(existing),
    });
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];
  const unitLabel = form.unit && form.unit !== 'pcs' ? form.unit : '';

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ title: isNew ? 'Add to my home' : 'Edit item' }} />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* Icon */}
          <View style={styles.avatarBlock}>
            <PressScale
              scaleTo={0.9}
              onPress={() => {
                tapFeedback();
                setShowEmojis((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityLabel="Change icon">
              <Animated.View key={form.emoji} entering={ZoomIn.springify()}>
                <ItemAvatar emoji={form.emoji} priority={form.priority} size={88} />
              </Animated.View>
            </PressScale>
            <ThemedText type="small" themeColor="textSecondary">
              {showEmojis ? 'Pick an icon' : 'Tap to change icon'}
            </ThemedText>
          </View>

          {showEmojis && (
            <Animated.View
              entering={FadeInDown.springify().damping(18)}
              exiting={FadeOut.duration(150)}
              style={[styles.emojiGrid, { backgroundColor: theme.backgroundElement }]}>
              {EMOJI_CHOICES.map((emoji) => (
                <PressScale
                  key={emoji}
                  scaleTo={0.8}
                  onPress={() => {
                    tapFeedback();
                    set('emoji', emoji);
                    setEmojiPicked(true);
                    setShowEmojis(false);
                  }}
                  style={[
                    styles.emojiCell,
                    form.emoji === emoji && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText style={styles.emojiChoice}>{emoji}</ThemedText>
                </PressScale>
              ))}
            </Animated.View>
          )}

          {/* Quick picks */}
          {isNew && (
            <Section title="Quick pick" hint="Tap one to fill everything in for you">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickRow}
                style={styles.bleed}>
                {QUICK_ADD.map((preset) => (
                  <PressScale
                    key={preset.name}
                    scaleTo={0.92}
                    onPress={() => applyPreset(preset)}
                    style={[
                      styles.quickChip,
                      {
                        backgroundColor:
                          form.name === preset.name ? `${PriorityMeta[preset.priority].color}22` : theme.backgroundElement,
                        borderColor:
                          form.name === preset.name ? PriorityMeta[preset.priority].color : 'transparent',
                      },
                    ]}>
                    <ThemedText style={styles.quickEmoji}>{preset.emoji}</ThemedText>
                    <ThemedText type="small">{preset.name}</ThemedText>
                  </PressScale>
                ))}
              </ScrollView>
            </Section>
          )}

          <Section title="What is it?">
            <TextInput
              value={form.name}
              onChangeText={setName}
              placeholder="e.g. Cooking gas, Bed sheets, Birthday cake"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, styles.nameInput]}
              autoCapitalize="sentences"
            />
          </Section>

          <Section title="How important is it?">
            {PRIORITIES.map((p) => {
              const meta = PriorityMeta[p];
              const selected = form.priority === p;
              return (
                <PressScale
                  key={p}
                  scaleTo={0.98}
                  onPress={() => {
                    tapFeedback();
                    set('priority', p);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[
                    styles.priorityOption,
                    {
                      borderColor: selected ? meta.color : theme.backgroundSelected,
                      backgroundColor: selected ? `${meta.color}14` : 'transparent',
                    },
                  ]}>
                  <ThemedText style={styles.priorityEmoji}>{meta.emoji}</ThemedText>
                  <View style={styles.flex}>
                    <ThemedText style={styles.priorityLabel}>{meta.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {meta.description}
                    </ThemedText>
                  </View>
                  <View style={[styles.radio, { borderColor: selected ? meta.color : theme.textSecondary }]}>
                    {selected && (
                      <Animated.View
                        entering={ZoomIn.springify()}
                        style={[styles.radioDot, { backgroundColor: meta.color }]}
                      />
                    )}
                  </View>
                </PressScale>
              );
            })}
          </Section>

          <Section title="How much do you have now?">
            <Stepper
              value={form.quantity}
              suffix={unitLabel}
              onChange={(v) => set('quantity', v)}
              onStep={(d) => step('quantity', d)}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.unitRow}
              style={styles.bleed}>
              {COMMON_UNITS.map((unit) => {
                const selected = form.unit === unit;
                return (
                  <PressScale
                    key={unit}
                    scaleTo={0.9}
                    onPress={() => {
                      tapFeedback();
                      set('unit', unit);
                    }}
                    style={[
                      styles.unitChip,
                      {
                        backgroundColor: selected ? theme.text : theme.backgroundElement,
                      },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: selected ? theme.background : theme.text }}>
                      {unit === 'pcs' ? 'pieces' : unit}
                    </ThemedText>
                  </PressScale>
                );
              })}
            </ScrollView>
          </Section>

          <Section
            title="Remind me when it goes below"
            hint="It will appear on your shopping list when you have less than this.">
            <Stepper
              value={form.minQuantity}
              suffix={unitLabel}
              onChange={(v) => set('minQuantity', v)}
              onStep={(d) => step('minQuantity', d)}
            />
          </Section>

          <Section title="Extra details" hint="Optional">
            <TextInput
              value={form.category}
              onChangeText={(v) => set('category', v)}
              placeholder="Room or group, e.g. Kitchen, Bedroom"
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
            />
            <TextInput
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
              placeholder="Notes, e.g. which brand or shop"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, styles.notes]}
              multiline
            />
          </Section>

          {error && (
            <Animated.View
              entering={FadeIn}
              style={[styles.error, { backgroundColor: `${StatusMeta.out.color}1A` }]}>
              <ThemedText style={{ color: StatusMeta.out.color }}>⚠️ {error}</ThemedText>
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition} style={styles.actions}>
            <PressScale
              onPress={() => {
                pressFeedback();
                save();
              }}
              accessibilityRole="button"
              style={styles.saveButton}>
              <ThemedText style={styles.saveText}>
                {isNew ? '✓  Add to my home' : '✓  Save changes'}
              </ThemedText>
            </PressScale>

            {existing && (
              <PressScale onPress={remove} accessibilityRole="button" style={styles.deleteButton}>
                <ThemedText style={{ color: StatusMeta.out.color, fontWeight: 600 }}>
                  🗑  Remove this item
                </ThemedText>
              </PressScale>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View>
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

function Stepper({
  value,
  suffix,
  onChange,
  onStep,
}: {
  value: string;
  suffix: string;
  onChange: (value: string) => void;
  onStep: (delta: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.stepper, { backgroundColor: theme.backgroundElement }]}>
      <PressScale
        scaleTo={0.85}
        onPress={() => onStep(-1)}
        style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }]}
        accessibilityLabel="Less">
        <ThemedText style={styles.stepLabel}>−</ThemedText>
      </PressScale>
      <View style={styles.stepValue}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          selectTextOnFocus
          style={[styles.stepInput, { color: theme.text }]}
        />
        {suffix ? (
          <ThemedText themeColor="textSecondary" style={styles.stepSuffix}>
            {suffix}
          </ThemedText>
        ) : null}
      </View>
      <PressScale
        scaleTo={0.85}
        onPress={() => onStep(1)}
        style={[styles.stepButton, styles.stepButtonPrimary]}
        accessibilityLabel="More">
        <ThemedText style={[styles.stepLabel, styles.white]}>+</ThemedText>
      </PressScale>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  white: {
    color: '#ffffff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
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
  avatarBlock: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: Spacing.two,
    borderRadius: 20,
    marginTop: -Spacing.two,
  },
  emojiCell: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiChoice: {
    fontSize: 26,
    lineHeight: 32,
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: 700,
  },
  quickRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  quickChip: {
    alignItems: 'center',
    width: 84,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: 16,
    borderWidth: 2,
    gap: Spacing.one,
  },
  quickEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  input: {
    fontSize: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 16,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: 600,
  },
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 2,
  },
  priorityEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: 700,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: Spacing.two,
  },
  stepButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonPrimary: {
    backgroundColor: '#208AEF',
  },
  stepLabel: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: 700,
  },
  stepValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  stepInput: {
    minWidth: 48,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 700,
    paddingVertical: Spacing.one,
  },
  stepSuffix: {
    fontSize: 16,
  },
  unitRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  unitChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  error: {
    padding: Spacing.three,
    borderRadius: 16,
  },
  actions: {
    gap: Spacing.one,
  },
  saveButton: {
    backgroundColor: '#208AEF',
    alignItems: 'center',
    paddingVertical: Spacing.three + Spacing.one,
    borderRadius: 18,
    boxShadow: '0 6px 16px rgba(32,138,239,0.35)',
  },
  saveText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 17,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
