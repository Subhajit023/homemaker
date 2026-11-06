import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS !== 'web';

/** Light tick for small taps like + / − and chip selection. */
export function tapFeedback() {
  if (enabled) Haptics.selectionAsync().catch(() => {});
}

/** Firmer bump for main buttons. */
export function pressFeedback() {
  if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Success buzz, e.g. after saving or marking something as bought. */
export function successFeedback() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Warning buzz, e.g. before deleting. */
export function warningFeedback() {
  if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
