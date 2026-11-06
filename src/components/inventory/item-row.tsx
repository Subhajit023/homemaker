import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { SurpriseTag } from '@/components/family/surprise';
import { ItemAvatar, StatusTag } from '@/components/inventory/pill';
import { ProgressBar } from '@/components/inventory/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { PressScale } from '@/components/ui/press-scale';
import { Spacing } from '@/constants/theme';
import { useInventory } from '@/features/inventory/inventory-store';
import { formatAmount, getStatus, getStockLevel, StatusMeta } from '@/features/inventory/meta';
import type { Item } from '@/features/inventory/types';
import { useTheme } from '@/hooks/use-theme';
import { tapFeedback } from '@/lib/haptics';
import { useT } from '@/i18n';

/** A friendly card for one item: icon, amount left, stock gauge and +/− buttons. */
export function ItemRow({ item }: { item: Item }) {
  const theme = useTheme();
  const t = useT();
  const { adjustQuantity } = useInventory();
  const statusColor = StatusMeta[getStatus(item)].color;

  function change(delta: number) {
    tapFeedback();
    adjustQuantity(item.id, delta);
  }

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      layout={LinearTransition.springify().damping(18)}
      style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <PressScale
        scaleTo={0.98}
        style={styles.main}
        accessibilityRole="button"
        accessibilityHint={t.item.opensDetails}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
        <ItemAvatar emoji={item.emoji} priority={item.priority} />
        <View style={styles.info}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <View style={styles.metaRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {t.item.left(formatAmount(item.quantity, item.unit))}
            </ThemedText>
            <StatusTag item={item} />
            <SurpriseTag hiddenFrom={item.hiddenFrom} compact />
          </View>
          <ProgressBar value={getStockLevel(item)} color={statusColor} height={5} />
        </View>
      </PressScale>

      <View style={styles.stepper}>
        <StepButton
          label="−"
          disabled={item.quantity <= 0}
          onPress={() => change(-1)}
          accessibilityLabel={t.item.usedOne(item.name)}
        />
        <StepButton
          label="+"
          primary
          onPress={() => change(1)}
          accessibilityLabel={t.item.addedOne(item.name)}
        />
      </View>
    </Animated.View>
  );
}

type StepButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  accessibilityLabel: string;
};

function StepButton({ label, onPress, disabled, primary, accessibilityLabel }: StepButtonProps) {
  const theme = useTheme();
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.85}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.stepButton,
        { backgroundColor: primary ? '#208AEF' : theme.backgroundSelected },
        disabled && styles.disabled,
      ]}>
      <ThemedText style={[styles.stepLabel, primary && styles.stepLabelPrimary]}>{label}</ThemedText>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two + Spacing.one,
    gap: Spacing.two,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  info: {
    flex: 1,
    gap: Spacing.one + Spacing.half,
  },
  name: {
    fontSize: 17,
    fontWeight: 700,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  stepper: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: 700,
  },
  stepLabelPrimary: {
    color: '#ffffff',
  },
  disabled: {
    opacity: 0.35,
  },
});
