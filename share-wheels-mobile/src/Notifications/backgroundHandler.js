/**
 * Must be imported before AppRegistry (see index.js).
 * Shows tray notifications via Notifee for background / headless FCM delivery.
 */
import {
  getFCMMessaging,
  setBackgroundMessageHandler,
} from "./firebaseMessaging";
import {
  displayForegroundNotification,
  ensureNotificationChannel,
} from "./displayLocalNotification";

setBackgroundMessageHandler(getFCMMessaging(), async (remoteMessage) => {
  try {
    await ensureNotificationChannel();
    await displayForegroundNotification(remoteMessage, { source: "background" });
  } catch (e) {
    if (__DEV__) {
      console.warn("[FCM] background display:", e?.message || e);
    }
  }
});
