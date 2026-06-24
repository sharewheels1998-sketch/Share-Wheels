const recentKeys = new Map();
const DEDUPE_MS = 8000;
const MAX_KEYS = 64;

/**
 * Prevent duplicate tray notifications when FCM OS tray and Notifee both fire.
 */
export function shouldSkipDuplicateNotification(key) {
  if (!key) return false;
  const now = Date.now();
  const prev = recentKeys.get(key);
  if (prev != null && now - prev < DEDUPE_MS) {
    return true;
  }
  recentKeys.set(key, now);
  if (recentKeys.size > MAX_KEYS) {
    for (const [k, ts] of recentKeys) {
      if (now - ts > DEDUPE_MS) recentKeys.delete(k);
    }
  }
  return false;
}

export function buildDedupeKey(remoteMessage, notificationId) {
  return (
    remoteMessage?.messageId ||
    notificationId ||
    `${remoteMessage?.data?.type || "general"}_${remoteMessage?.data?.rideId || ""}_${remoteMessage?.data?.notificationId || ""}`
  );
}
