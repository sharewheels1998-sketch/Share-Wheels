const { notifyUser } = require("../services/notificationService");
const { emitRideParticipantsUpdated } = require("./socketEmit");

const refIdStr = (ref) => ref?._id?.toString?.() || ref?.toString?.() || "";

const collectRideParticipantIds = (ride, { excludeDriver = false } = {}) => {
  const ids = new Set();
  const add = (id) => {
    const s = refIdStr(id);
    if (s) ids.add(s);
  };
  if (!excludeDriver) add(ride.creator);
  (ride.passengers || []).forEach((p) => add(p.userId));
  (ride.all_deliveries || []).forEach((d) => add(d.userId));
  (ride.passenger_requested_ride || []).forEach((r) => add(r.userId));
  (ride.users_request_Couriers || []).forEach((c) => add(c.userId));
  return [...ids];
};

const rideRouteLabel = (ride) => `${ride.from} → ${ride.to}`;

/**
 * Notify all ride participants (optionally excluding driver).
 */
const notifyRideParticipants = async (
  ride,
  { title, body, type, data = {}, excludeDriver = false, driverMessage }
) => {
  const route = rideRouteLabel(ride);
  const driverId = refIdStr(ride.creator);
  const participantIds = collectRideParticipantIds(ride, { excludeDriver });

  await Promise.all(
    participantIds.map((uid) =>
      notifyUser(uid, {
        title,
        body:
          uid === driverId && driverMessage
            ? driverMessage.replace("{route}", route)
            : body.replace("{route}", route),
        type,
        data: { rideId: ride._id.toString(), ...data },
      })
    )
  );
};

const emitRideScheduleUpdated = (rideId, action, extra = {}) => {
  emitRideParticipantsUpdated(rideId, { action, ...extra });
};

module.exports = {
  refIdStr,
  collectRideParticipantIds,
  rideRouteLabel,
  notifyRideParticipants,
  emitRideScheduleUpdated,
};
