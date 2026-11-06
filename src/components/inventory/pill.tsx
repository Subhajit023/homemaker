import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { getStatus, getStatusLabel, PriorityMeta, StatusMeta } from '@/features/inventory/meta';
import type { Item, Priority } from '@/features/inventory/types';

/** Small rounded label tinted with `color` (expects a 6-digit hex). */
export function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <ThemedText style={[styles.text, { color }]}>{label}</ThemedText>
    </View>
  );
}

/** "● Running low" style status for an item. */
export function StatusTag({ item }: { item: Item }) {
  const color = StatusMeta[getStatus(item)].color;
  return <Pill label={`● ${getStatusLabel(item)}`} color={color} />;
}

/** Item emoji in a soft circle tinted with its priority colour. */
export function ItemAvatar({
  emoji,
  priority,
  size = 48,
}: {
  emoji: string;
  priority: Priority;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${PriorityMeta[priority].color}1F`,
        },
      ]}>
      <ThemedText style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>{emoji}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
