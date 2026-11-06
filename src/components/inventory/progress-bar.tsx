import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  /** 0–1 */
  value: number;
  color: string;
  height?: number;
  trackColor?: string;
};

/** A rounded bar that smoothly animates to its new value. */
export function ProgressBar({ value, color, height = 6, trackColor }: ProgressBarProps) {
  const theme = useTheme();
  const target = Math.min(1, Math.max(0, value));
  const progress = useSharedValue(target);

  useEffect(() => {
    progress.set(withTiming(target, { duration: 400 }));
  }, [progress, target]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? theme.backgroundSelected },
      ]}>
      <Animated.View
        style={[styles.fill, { borderRadius: height / 2, backgroundColor: color }, fillStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
