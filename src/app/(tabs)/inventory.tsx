import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow } from '@/components/inventory/item-row';
import { TabScreen } from '@/components/inventory/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useInventory } from '@/features/inventory/inventory-store';
import { compareByUrgency, PRIORITIES, PriorityMeta } from '@/features/inventory/meta';
import type { Priority } from '@/features/inventory/types';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, tapFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

function parsePriority(value: string | undefined): Priority | null {
  return value === '1' || value === '2' || value === '3' ? (Number(value) as Priority) : null;
}

export default function InventoryScreen() {
  const theme = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { items } = useInventory();
  const params = useLocalSearchParams<{ priority?: string }>();
  const filter = parsePriority(params.priority);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const sections = PRIORITIES.filter((p) => filter === null || p === filter)
    .map((priority) => ({
      priority,
      data: items
        .filter(
          (item) =>
            item.priority === priority &&
            (!q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
        )
        .sort(compareByUrgency),
    }))
    .filter((section) => section.data.length > 0);

  function selectFilter(priority: Priority | null) {
    tapFeedback();
    router.setParams({ priority: priority === null ? undefined : String(priority) });
  }

  return (
    <TabScreen>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={[1]}>
        <View style={styles.titleBlock}>
          <ThemedText style={styles.title}>{t.inventory.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t.inventory.subtitle(items.length)}
          </ThemedText>
        </View>

        {/* Sticky search + filters */}
        <View style={[styles.controls, { backgroundColor: theme.background }]}>
          <View style={[styles.search, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.searchIcon}>🔍</ThemedText>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.inventory.search}
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel={t.inventory.clearSearch}>
                <ThemedText themeColor="textSecondary" style={styles.clear}>
                  ✕
                </ThemedText>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            <Chip label={t.inventory.everything} selected={filter === null} onPress={() => selectFilter(null)} />
            {PRIORITIES.map((priority) => {
              const meta = PriorityMeta[priority];
              return (
                <Chip
                  key={priority}
                  label={`${meta.emoji} ${meta.label}`}
                  color={meta.color}
                  selected={filter === priority}
                  onPress={() => selectFilter(priority)}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.list}>
          {sections.length === 0 ? (
            <Animated.View entering={FadeIn} style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>{q ? '🤔' : '📦'}</ThemedText>
              <ThemedText style={styles.emptyTitle}>
                {q ? t.inventory.nothingFound : t.inventory.nothingYet}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.center}>
                {q ? t.inventory.notFound(query.trim()) : t.inventory.addFirst}
              </ThemedText>
            </Animated.View>
          ) : (
            sections.map((section) => {
              const meta = PriorityMeta[section.priority];
              return (
                <Animated.View
                  key={section.priority}
                  layout={LinearTransition.springify().damping(18)}
                  style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionEmoji}>{meta.emoji}</ThemedText>
                    <View style={styles.flex}>
                      <ThemedText style={styles.sectionTitle}>{meta.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {meta.description}
                      </ThemedText>
                    </View>
                  </View>
                  {section.data.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating add button */}
      <Animated.View
        entering={ZoomIn.delay(200).springify()}
        style={[styles.fabWrap, { bottom: BottomTabInset + Spacing.three + insets.bottom }]}>
        <PressScale
          scaleTo={0.9}
          accessibilityRole="button"
          accessibilityLabel={t.home.addItem}
          onPress={() => {
            pressFeedback();
            router.push({ pathname: '/item/[id]', params: { id: 'new' } });
          }}
          style={styles.fab}>
          <ThemedText style={styles.fabText}>{t.inventory.addItem}</ThemedText>
        </PressScale>
      </Animated.View>
    </TabScreen>
  );
}

type ChipProps = { label: string; selected: boolean; onPress: () => void; color?: string };

function Chip({ label, selected, onPress, color }: ChipProps) {
  const theme = useTheme();
  const active = color ?? theme.text;
  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: active, borderColor: active }
          : { borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement },
      ]}>
      <ThemedText
        type="smallBold"
        style={{ color: selected ? (color ? '#ffffff' : theme.background) : theme.text }}>
        {label}
      </ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  content: {
    paddingBottom: BottomTabInset + 120,
  },
  titleBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
  },
  controls: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two + Spacing.one,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    gap: Spacing.two,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  clear: {
    fontSize: 16,
  },
  chips: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    borderWidth: 1,
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
    paddingTop: Spacing.two,
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  sectionEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
  },
  fabWrap: {
    position: 'absolute',
    right: Spacing.three,
  },
  fab: {
    backgroundColor: '#208AEF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: 28,
    boxShadow: '0 6px 16px rgba(32,138,239,0.45)',
  },
  fabText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 16,
  },
});
