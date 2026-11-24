import * as Haptics from "expo-haptics";

/**
 * Haptic feedback that can never break the UI: if the device or the Expo Go
 * build has no haptics module, the call quietly does nothing.
 */
function safe(run: () => Promise<unknown>) {
  try {
    void run().catch(() => undefined);
  } catch {
    /* module unavailable */
  }
}

export const haptic = {
  /** Picking an option (colour, pattern, size). */
  select: () => safe(() => Haptics.selectionAsync()),
  /** Pressing a button. */
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
