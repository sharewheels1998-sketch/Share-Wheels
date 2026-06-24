import notifee, { EventType } from "@notifee/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PENDING_NOTIFICATION_KEY = "PENDING_NOTIFICATION_OPEN";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  try {
    if (type === EventType.PRESS && detail?.notification) {
      await AsyncStorage.setItem(
        PENDING_NOTIFICATION_KEY,
        JSON.stringify({
          data: detail.notification.data || {},
          notification: {
            title: detail.notification.title,
            body: detail.notification.body,
          },
        })
      );
    }
  } catch (e) {
    if (__DEV__) {
      console.warn("[Notifee] background event:", e?.message || e);
    }
  }
});

export async function consumePendingNotificationOpen() {
  const raw = await AsyncStorage.getItem(PENDING_NOTIFICATION_KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(PENDING_NOTIFICATION_KEY);
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
