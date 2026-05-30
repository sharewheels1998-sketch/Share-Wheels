const mongoose = require("mongoose");
const User = require("../models/userModel");
const Ride = require("../models/rideModel");
const PassengerRide = require("../models/passengerRideModel");
const Courier = require("../models/courierModel");
const UserRides = require("../models/userRides");
const RideMessage = require("../models/rideMessageModel");
const Notification = require("../models/notificationModel");
const Feedback = require("../models/feedbackModel");

/**
 * Remove a user and all documents that reference them.
 */
const deleteUserCascade = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { ok: false, message: "Invalid user id" };
  }

  const oid = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(oid);
  if (!user) {
    return { ok: false, message: "User not found" };
  }

  const creatorRideIds = await Ride.find({ creator: oid }).distinct("_id");

  const [messages, rides, passengerRides, couriers, userRides, notifications, feedback] =
    await Promise.all([
      RideMessage.deleteMany({
        $or: [
          { rideId: { $in: creatorRideIds } },
          { senderId: oid },
          { recipientId: oid },
        ],
      }),
      Ride.deleteMany({ creator: oid }),
      PassengerRide.deleteMany({ creator: oid }),
      Courier.deleteMany({ creator: oid }),
      UserRides.deleteMany({ creator: oid }),
      Notification.deleteMany({ userId: oid }),
      Feedback.deleteMany({ userId: oid }),
    ]);

  const pullFromRides = {
    $pull: {
      passengers: { userId: oid },
      droput_Passengers: { userId: oid },
      passenger_requested_ride: { userId: oid },
      users_request_Couriers: { userId: oid },
      all_deliveries: { userId: oid },
      driver_requested_passengers: { userId: oid },
    },
  };

  const rideRefs = await Ride.updateMany(
    {
      $or: [
        { "passengers.userId": oid },
        { "droput_Passengers.userId": oid },
        { "passenger_requested_ride.userId": oid },
        { "users_request_Couriers.userId": oid },
        { "all_deliveries.userId": oid },
        { "driver_requested_passengers.userId": oid },
      ],
    },
    pullFromRides
  );

  const passengerJoinPull = await PassengerRide.updateMany(
    { "join_requested_By.userId": oid },
    { $pull: { join_requested_By: { userId: oid } } }
  );
  const passengerAssignClear = await PassengerRide.updateMany(
    { "assigned_to.userId": oid },
    { $unset: { assigned_to: "" }, $set: { status: "pending" } }
  );
  const passengerRefs = {
    modifiedCount:
      (passengerJoinPull.modifiedCount || 0) + (passengerAssignClear.modifiedCount || 0),
  };

  const courierRefs = await Courier.updateMany(
    { "driver_assigned_courier.userId": oid },
    { $unset: { driver_assigned_courier: "" } }
  );

  await User.findByIdAndDelete(oid);

  return {
    ok: true,
    deleted: {
      user: user.email,
      ridesAsCreator: rides.deletedCount,
      rideMessages: messages.deletedCount,
      passengerRides: passengerRides.deletedCount,
      couriers: couriers.deletedCount,
      userRidesDocs: userRides.deletedCount,
      notifications: notifications.deletedCount,
      feedback: feedback.deletedCount,
      ridesUpdated: rideRefs.modifiedCount,
      passengerRidesUpdated: passengerRefs.modifiedCount,
      couriersUpdated: courierRefs.modifiedCount,
    },
  };
};

module.exports = { deleteUserCascade };
