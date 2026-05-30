const mongoose = require("mongoose");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { sendPushNotification } = require("../utils/firebaseAdmin");
const { emitNotificationReceived } = require("../utils/socketEmit");

const resolveUserId = (userId) => {
  if (!userId) return null;
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  if (userId._id) return userId._id;
  try {
    return new mongoose.Types.ObjectId(userId);
  } catch {
    return null;
  }
};

/**
 * Persist in-app notification, push via FCM when possible, and notify connected clients.
 */
const notifyUser = async (userId, { title, body, type = "general", data = {} }) => {
  if (!userId || !title || !body) return { saved: false, pushed: false };

  const uid = resolveUserId(userId);
  if (!uid) return { saved: false, pushed: false };

  const dataPayload = Object.fromEntries(
    Object.entries(data || {}).map(([k, v]) => [k, v == null ? "" : String(v)])
  );

  let doc;
  try {
    doc = await Notification.create({
      userId: uid,
      title,
      body,
      type,
      data: dataPayload,
      read: false,
    });
  } catch (err) {
    console.warn("[notifyUser] save failed:", err.message);
    return { saved: false, pushed: false };
  }

  const socketPayload = {
    notificationId: doc._id.toString(),
    title,
    body,
    type,
    ...dataPayload,
  };
  emitNotificationReceived(uid, socketPayload);

  const user = await User.findById(uid).select("fcmToken");
  let pushed = false;

  if (user?.fcmToken) {
    try {
      const result = await sendPushNotification(user.fcmToken, title, body, {
        type,
        notificationId: doc._id.toString(),
        ...dataPayload,
      });
      pushed = !!result?.success;
      if (result?.invalidToken) {
        user.fcmToken = undefined;
        await user.save();
      }
    } catch (err) {
      console.warn("[notifyUser] FCM failed:", err.message);
    }
  }

  return { saved: true, pushed, notificationId: doc._id };
};

const listForUser = async (user, { limit = 50, skip = 0 } = {}) => {
  const items = await Notification.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 100))
    .lean();

  const unreadCount = await Notification.countDocuments({
    userId: user._id,
    read: false,
  });

  return {
    status: 200,
    body: {
      success: true,
      notifications: items,
      unreadCount,
    },
  };
};

const markRead = async (user, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    return { status: 400, body: { success: false, message: "Invalid notification id" } };
  }
  const doc = await Notification.findOneAndUpdate(
    { _id: notificationId, userId: user._id },
    { read: true },
    { new: true }
  );
  if (!doc) {
    return { status: 404, body: { success: false, message: "Notification not found" } };
  }
  const unreadCount = await Notification.countDocuments({
    userId: user._id,
    read: false,
  });
  return { status: 200, body: { success: true, notification: doc, unreadCount } };
};

const markAllRead = async (user) => {
  await Notification.updateMany({ userId: user._id, read: false }, { read: true });
  return {
    status: 200,
    body: { success: true, unreadCount: 0 },
  };
};

module.exports = {
  notifyUser,
  listForUser,
  markRead,
  markAllRead,
};
