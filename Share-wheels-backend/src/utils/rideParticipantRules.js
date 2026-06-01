const toUserIdString = (ref) => {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return ref._id?.toString?.() || ref.toString?.() || "";
};

const isUserPassengerOnRide = (ride, userId) => {
  const uid = toUserIdString(userId);
  if (!uid) return false;
  if ((ride.passengers || []).some((p) => toUserIdString(p.userId) === uid)) return true;
  if ((ride.passenger_requested_ride || []).some((p) => toUserIdString(p.userId) === uid)) {
    return true;
  }
  return false;
};

const isUserCourierOnRide = (ride, userId) => {
  const uid = toUserIdString(userId);
  if (!uid) return false;
  if ((ride.all_deliveries || []).some((c) => toUserIdString(c.userId) === uid)) return true;
  if ((ride.users_request_Couriers || []).some((c) => toUserIdString(c.userId) === uid)) {
    return true;
  }
  return false;
};

const passengerBlocksCourierMessage =
  "You are already a passenger on this ride. You cannot also join as a courier on the same trip.";

const courierBlocksPassengerMessage =
  "You are already a courier on this ride. You cannot also book a passenger seat on the same trip.";

const rejectIfPassengerJoiningAsCourier = (ride, userId) => {
  if (isUserPassengerOnRide(ride, userId)) {
    return { blocked: true, message: passengerBlocksCourierMessage };
  }
  return { blocked: false };
};

const rejectIfCourierJoiningAsPassenger = (ride, userId) => {
  if (isUserCourierOnRide(ride, userId)) {
    return { blocked: true, message: courierBlocksPassengerMessage };
  }
  return { blocked: false };
};

module.exports = {
  toUserIdString,
  isUserPassengerOnRide,
  isUserCourierOnRide,
  rejectIfPassengerJoiningAsCourier,
  rejectIfCourierJoiningAsPassenger,
  passengerBlocksCourierMessage,
  courierBlocksPassengerMessage,
};
