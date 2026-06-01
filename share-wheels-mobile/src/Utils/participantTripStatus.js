export const TRIP_STATUS = {
  ACCEPTED: "accepted",
  PICKED_UP: "picked_up",
  DROPPED: "dropped",
  DELIVERED: "delivered",
};

const LABELS = {
  accepted: "Accepted",
  picked_up: "Picked Up",
  dropped: "Dropped",
  delivered: "Delivered",
};

export const tripStatusLabel = (status) =>
  LABELS[(status || "").toLowerCase()] || status || "Accepted";

export const passengerCountsTowardEarnings = (p) =>
  !!p?.isBoardingVerified &&
  (p?.status || "").toLowerCase() === TRIP_STATUS.DROPPED;

export const courierCountsTowardEarnings = (c) =>
  !!c?.isBoardingVerified &&
  (c?.status || "").toLowerCase() === TRIP_STATUS.DELIVERED;

/** After OTP verify (picked_up) — show Drop / Delivered (ride must be started to complete action). */
export const canDropPassenger = (p) =>
  !!p?.isBoardingVerified &&
  (p?.status || "").toLowerCase() === TRIP_STATUS.PICKED_UP;

export const canDeliverCourier = (c) =>
  !!c?.isBoardingVerified &&
  (c?.status || "").toLowerCase() === TRIP_STATUS.PICKED_UP;
