import { Platform } from "react-native";
import notifee, { AndroidImportance, AndroidStyle, EventType } from "@notifee/react-native";
import { CHANNELS, resolveNotificationChannel } from "./notificationChannels";
import {
  buildDedupeKey,
  shouldSkipDuplicateNotification,
} from "./notificationDedupe";

let channelsReady = false;

export async function ensureNotificationChannel() {
  if (channelsReady || Platform.OS !== "android") {
    channelsReady = true;
    return;
  }

  await notifee.createChannel({
    id: CHANNELS.rides,
    name: "Rides & bookings",
    importance: AndroidImportance.HIGH,
    sound: "default",
    vibration: true,
  });
  await notifee.createChannel({
    id: CHANNELS.chat,
    name: "Ride chat",
    importance: AndroidImportance.HIGH,
    sound: "default",
    vibration: true,
  });
  await notifee.createChannel({
    id: CHANNELS.reminders,
    name: "Reminders & expiry",
    importance: AndroidImportance.DEFAULT,
    sound: "default",
    vibration: true,
  });
  channelsReady = true;
}

const TYPE_LABELS = {
  passenger_request: "Passenger request",
  courier_request: "Courier request",
  passenger_joined: "New passenger",
  courier_joined: "New courier",
  ride_accept: "Request accepted",
  ride_reject: "Request declined",
  chat_message: "New message",
  ride_start_reminder: "Ride reminder",
  boarding_otp_issued: "Boarding OTP",
};

/** Notifee requires id to be a non-empty string (no bare "0"). */
const sanitizeNotificationId = (raw) => {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 64);
  if (cleaned && cleaned !== "0") return cleaned;
  return `sw_${Date.now()}`;
};

/** All data payload values must be strings for Notifee / FCM. */
const sanitizeData = (data = {}) => {
  const out = {};
  Object.entries(data || {}).forEach(([key, value]) => {
    if (!key || key === "notifee_options") return;
    if (value == null) {
      out[String(key)] = "";
      return;
    }
    out[String(key)] = typeof value === "string" ? value : String(value);
  });
  return out;
};

const buildDisplayPayload = (remoteMessage) => {
  const data = sanitizeData(remoteMessage?.data || {});
  const type = data.type || "general";
  const title = String(
    remoteMessage?.notification?.title || data.title || "Share Wheels"
  );
  const body = String(remoteMessage?.notification?.body || data.body || "");
  const rideId = data.rideId ? String(data.rideId) : "";
  const notificationId = data.notificationId
    ? String(data.notificationId)
    : data.passengerRideId
      ? String(data.passengerRideId)
      : data.courierId
        ? String(data.courierId)
        : "";

  return { data, type, title, body, rideId, notificationId };
};

/**
 * Show a tray notification (foreground / background FCM).
 * @param {object} remoteMessage
 * @param {{ source?: 'foreground' | 'background' }} options
 */
export async function displayForegroundNotification(remoteMessage, options = {}) {
  const { data, type, title, body, rideId, notificationId } =
    buildDisplayPayload(remoteMessage);

  if (!title && !body) return;

  const id = sanitizeNotificationId(
    notificationId || `${type}_${rideId || "general"}`
  );
  const dedupeKey = buildDedupeKey(remoteMessage, id);
  if (shouldSkipDuplicateNotification(dedupeKey)) {
    if (__DEV__) {
      console.log("[FCM] skip duplicate tray:", dedupeKey, options.source || "foreground");
    }
    return;
  }

  await ensureNotificationChannel();
  const channelId = resolveNotificationChannel(type);
  const typeLabel = TYPE_LABELS[type] || "Share Wheels";
  const safeBody = body || title;

  await notifee.displayNotification({
    id,
    title,
    body: safeBody,
    subtitle: Platform.OS === "ios" ? typeLabel : undefined,
    data,
    android: {
      channelId,
      smallIcon: "ic_notification",
      color: "#2563EB",
      tag: id,
      pressAction: { id: "default" },
      autoCancel: true,
      ...(safeBody.length > 80
        ? {
            style: {
              type: AndroidStyle.BIGTEXT,
              text: safeBody,
            },
          }
        : {}),
    },
    ios: {
      threadId: rideId || "share_wheels",
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
  });
}

/**
 * Tap on a local Notifee notification (foreground display).
 */
export function registerNotifeeForegroundPress(handler) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      handler?.({
        data: detail.notification?.data,
        notification: detail.notification,
      });
    }
  });
}
