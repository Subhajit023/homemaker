import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOutLeft,
  LinearTransition,
  ZoomIn,
} from 'react-native-reanimated';

import { ItemAvatar } from '@/components/inventory/pill';
import { TabScreen } from '@/components/inventory/tab-screen';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { PressScale } from '@/components/ui/press-scale';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useInventory } from '@/features/inventory/inventory-store';
import {
  compareByUrgency,
  formatAmount,
  getShortfall,
  getStatus,
  PRIORITIES,
  PriorityMeta,
  StatusMeta,
} from '@/features/inventory/meta';
import type { Item } from '@/features/inventory/types';
import { useTheme } from '@/hooks/use-theme';
import { pressFeedback, successFeedback } from '@/lib/haptics';

function buildShareText(items: Item[]) {
  const lines = ['🛒 Shopping list', ''];
  for (const priority of PRIORITIES) {
    const group = items.filter((item) => item.priority === priority);
    if (group.length === 0) continue;
    lines.push(`${PriorityMeta[priority].emoji} ${PriorityMeta[priority].label}`);
    for (const item of group) {
      lines.push(`• ${item.name}: ${formatAmount(getShortfall(item), item.unit)}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export default function ShoppingScreen() {
  const theme = useTheme();
  const { items } = useInventory();
  const needed = items.filter((item) => getStatus(item) !== 'ok').sort(compareByUrgency);

  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <ThemedText style={styles.title}>Shopping list</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {needed.length === 0
                ? 'Nothing to buy right now.'
                : `${needed.length} thing${needed.length === 1 ? '' : 's'} to buy. Most important first.`}
            </ThemedText>
          </View>
          {needed.length > 0 && (
            <PressScale
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel="Share shopping list"
              onPress={() => {
                pressFeedback();
                Share.share({ message: buildShareText(needed) }).catch(() => {});
              }}
              style={[styles.shareButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">📤 Share</ThemedText>
            </PressScale>
          )}
        </View>

        {needed.length === 0 ? (
          <Animated.View entering={ZoomIn.springify()} style={styles.empty}>
            <ThemedText style={styles.emptyEmoji}>🎉</ThemedText>
            <ThemedText style={styles.emptyTitle}>All stocked up!</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Your home has everything it needs. Things that run low will show up here
              automatically.
            </ThemedText>
          </Animated.View>
        ) : (
          <>
            {PRIORITIES.map((priority) => {
              const group = needed.filter((item) => item.priority === priority);
              if (group.length === 0) return null;
              const meta = PriorityMeta[priority];
              return (
                <Animated.View
                  key={priority}
                  layout={LinearTransition.springify().damping(18)}
                  exiting={FadeOutLeft}
                  style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionEmoji}>{meta.emoji}</ThemedText>
                    <ThemedText style={styles.sectionTitle}>{meta.label}</ThemedText>
                    <View style={[styles.countBadge, { backgroundColor: `${meta.color}22` }]}>
                      <ThemedText type="smallBold" style={{ color: meta.color }}>
                        {group.length}
                      </ThemedText>
                    </View>
                  </View>
                  {group.map((item) => (
                    <ShoppingRow key={item.id} item={item} />
                  ))}
                </Animated.View>
              );
            })}
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Tick the circle once you’ve bought something.
            </ThemedText>
          </>
        )}
      </ScrollView>
    </TabScreen>
  );
}

function ShoppingRow({ item }: { item: Item }) {
  const theme = useTheme();
  const toast = useToast();
  const { setQuantity } = useInventory();
  const [ticked, setTicked] = useState(false);
  const status = getStatus(item);
  const color = StatusMeta[status].color;

  function markBought() {
    const previous = item.quantity;
    setTicked(true);
    successFeedback();
    // Let the tick animation play before the row slides away.
    setTimeout(() => {
      setQuantity(item.id, item.minQuantity);
      toast({
        message: `${item.emoji} ${item.name} marked as bought`,
        actionLabel: 'Undo',
        onAction: () => setQuantity(item.id, previous),
      });
    }, 350);
  }

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOutLeft.duration(250)}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <PressScale
        scaleTo={0.98}
        style={styles.rowMain}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
        <ItemAvatar emoji={item.emoji} priority={item.priority} size={44} />
        <View style={styles.flex}>
          <ThemedText style={[styles.name, ticked && styles.ticked]} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText type="small" style={{ color }}>
            Buy {formatAmount(getShortfall(item), item.unit)}
            <ThemedText type="small" themeColor="textSecondary">
              {'  ·  '}have {formatAmount(item.quantity, item.unit)}
            </ThemedText>
          </ThemedText>
          {item.notes ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              📝 {item.notes}
            </ThemedText>
          ) : null}
        </View>
      </PressScale>

      <PressScale
        scaleTo={0.85}
        disabled={ticked}
        onPress={markBought}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: ticked }}
        accessibilityLabel={`Mark ${item.name} as bought`}
        style={[
          styles.check,
          ticked
            ? { backgroundColor: StatusMeta.ok.color, borderColor: StatusMeta.ok.color }
            : { borderColor: theme.textSecondary },
        ]}>
        {ticked && (
          <Animated.View entering={ZoomIn.springify()}>
            <ThemedText style={styles.checkMark}>✓</ThemedText>
          </Animated.View>
        )}
      </PressScale>
    </Animated.View>
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
  shareButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  section: {
    gap: Spacing.two + Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sectionEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: 700,
  },
  countBadge: {
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  name: {
    fontSize: 17,
    fontWeight: 700,
  },
  ticked: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: 800,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyEmoji: {
    fontSize: 64,
    lineHeight: 76,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
});
