import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ItemRow } from '@/components/inventory/item-row';
import { ProgressBar } from '@/components/inventory/progress-bar';
import { TabScreen } from '@/components/inventory/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useInventory } from '@/features/inventory/inventory-store';
import {
  compareByUrgency,
  getStatus,
  PRIORITIES,
  PriorityMeta,
  StatusMeta,
} from '@/features/inventory/meta';
import type { Item, StockStatus } from '@/features/inventory/types';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, tapFeedback } from '@/lib/haptics';

const PREVIEW_LIMIT = 4;

function summarize(items: Item[]) {
  const counts = { total: items.length, ok: 0, low: 0, out: 0 };
  for (const item of items) counts[getStatus(item)] += 1;
  return counts;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function heroMessage(percent: number, toBuy: number) {
  if (toBuy === 0) return 'Everything is stocked. Nice work! 🎉';
  if (percent >= 80) return `Almost there, just ${toBuy} thing${toBuy === 1 ? '' : 's'} to pick up.`;
  if (percent >= 50) return `${toBuy} things are running low. Time for a shopping trip?`;
  return `${toBuy} things need buying soon.`;
}

/** Staggered fade-in so the dashboard builds up section by section. */
function enter(index: number) {
  return FadeInDown.delay(index * 70).springify().damping(18);
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { items } = useInventory();
  const overall = summarize(items);
  const toBuy = overall.low + overall.out;
  const percent = overall.total ? Math.round((overall.ok / overall.total) * 100) : 100;
  const urgent = items.filter((item) => getStatus(item) !== 'ok').sort(compareByUrgency);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <Animated.View entering={enter(0)} style={styles.header}>
          <View style={styles.flex}>
            <ThemedText type="small" themeColor="textSecondary">
              {today}
            </ThemedText>
            <ThemedText style={styles.greeting}>{greeting()} 👋</ThemedText>
          </View>
          <PressScale
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel="Add an item"
            onPress={() => {
              pressFeedback();
              router.push({ pathname: '/item/[id]', params: { id: 'new' } });
            }}
            style={styles.addCircle}>
            <ThemedText style={styles.addCircleText}>＋</ThemedText>
          </PressScale>
        </Animated.View>

        {/* Hero: how stocked is the home */}
        <Animated.View entering={enter(1)}>
          <PressScale
            scaleTo={0.98}
            onPress={() => {
              tapFeedback();
              router.navigate('/restock');
            }}
            style={styles.hero}>
            <ThemedText style={styles.heroLabel}>Your home is</ThemedText>
            <ThemedText style={styles.heroPercent}>{percent}% stocked</ThemedText>
            <ProgressBar
              value={percent / 100}
              color="#ffffff"
              trackColor="rgba(255,255,255,0.3)"
              height={10}
            />
            <ThemedText style={styles.heroMessage}>{heroMessage(percent, toBuy)}</ThemedText>
            {toBuy > 0 && (
              <View style={styles.heroButton}>
                <ThemedText style={styles.heroButtonText}>🛒 Open shopping list</ThemedText>
              </View>
            )}
          </PressScale>
        </Animated.View>

        {/* Status tiles */}
        <Animated.View entering={enter(2)} style={styles.tiles}>
          <StatusTile status="out" count={overall.out} emoji="🚨" />
          <StatusTile status="low" count={overall.low} emoji="⏳" />
          <StatusTile status="ok" count={overall.ok} emoji="✅" />
        </Animated.View>

        {/* Running out */}
        {urgent.length > 0 && (
          <Animated.View entering={enter(3)} style={styles.section}>
            <SectionHeader
              title="Running out"
              action={urgent.length > PREVIEW_LIMIT ? `See all ${urgent.length}` : undefined}
              onAction={() => router.navigate('/restock')}
            />
            {urgent.slice(0, PREVIEW_LIMIT).map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </Animated.View>
        )}

        {/* Priority groups */}
        <Animated.View entering={enter(4)} style={styles.section}>
          <SectionHeader title="Your home at a glance" />
          {PRIORITIES.map((priority) => {
            const meta = PriorityMeta[priority];
            const group = summarize(items.filter((item) => item.priority === priority));
            const needs = group.low + group.out;
            return (
              <PressScale
                key={priority}
                scaleTo={0.98}
                onPress={() => {
                  tapFeedback();
                  router.navigate({
                    pathname: '/inventory',
                    params: { priority: String(priority) },
                  });
                }}
                style={[styles.groupCard, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.groupIcon, { backgroundColor: `${meta.color}1F` }]}>
                  <ThemedText style={styles.groupEmoji}>{meta.emoji}</ThemedText>
                </View>
                <View style={styles.groupInfo}>
                  <View style={styles.groupTitleRow}>
                    <ThemedText style={styles.groupTitle}>{meta.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {group.ok} of {group.total} ›
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {meta.description}
                  </ThemedText>
                  <ProgressBar
                    value={group.total ? group.ok / group.total : 1}
                    color={meta.color}
                  />
                  <ThemedText
                    type="small"
                    style={{ color: needs ? StatusMeta.low.color : StatusMeta.ok.color }}>
                    {needs ? `${needs} to buy` : 'All good ✓'}
                  </ThemedText>
                </View>
              </PressScale>
            );
          })}
        </Animated.View>

        {/* Tip */}
        <Animated.View
          entering={enter(5)}
          style={[styles.tip, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={styles.tipEmoji}>💡</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
            Tap <ThemedText type="smallBold">＋</ThemedText> when you buy something and{' '}
            <ThemedText type="smallBold">−</ThemedText> when you use it up. We’ll tell you what to
            buy next.
          </ThemedText>
        </Animated.View>
      </ScrollView>
    </TabScreen>
  );
}

function StatusTile({ status, count, emoji }: { status: StockStatus; count: number; emoji: string }) {
  const meta = StatusMeta[status];
  return (
    <PressScale
      scaleTo={0.95}
      onPress={() => {
        tapFeedback();
        router.navigate(status === 'ok' ? '/inventory' : '/restock');
      }}
      style={[styles.tile, { backgroundColor: `${meta.color}1A` }]}>
      <ThemedText style={styles.tileEmoji}>{emoji}</ThemedText>
      <ThemedText style={[styles.tileCount, { color: meta.color }]}>{count}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {meta.label}
      </ThemedText>
    </PressScale>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {action && (
        <PressScale onPress={onAction} hitSlop={8}>
          <ThemedText type="linkPrimary">{action} ›</ThemedText>
        </PressScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
  greeting: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 700,
  },
  addCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(32,138,239,0.4)',
  },
  addCircleText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 700,
  },
  hero: {
    backgroundColor: '#208AEF',
    borderRadius: 28,
    padding: Spacing.four,
    gap: Spacing.two,
    experimental_backgroundImage: 'linear-gradient(135deg, #3A9BFF 0%, #1565C0 100%)',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.85)',
  },
  heroPercent: {
    color: '#ffffff',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: 800,
    marginBottom: Spacing.one,
  },
  heroMessage: {
    color: '#ffffff',
    marginTop: Spacing.one,
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
    marginTop: Spacing.two,
  },
  heroButtonText: {
    color: '#1565C0',
    fontWeight: 700,
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  tileEmoji: {
    fontSize: 20,
    lineHeight: 26,
  },
  tileCount: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 800,
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
  groupCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  groupInfo: {
    flex: 1,
    gap: Spacing.one + Spacing.half,
  },
  groupTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: 700,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 20,
  },
  tipEmoji: {
    fontSize: 24,
    lineHeight: 30,
  },
});
