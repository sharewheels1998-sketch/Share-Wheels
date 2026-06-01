/** Stable user id from an embedded ride passenger/courier item. */
export function getParticipantUserId(item) {
  const u = item?.userId ?? item?.user;
  if (u == null) return null;
  if (typeof u === "string") return u;
  const id = u._id ?? u.id;
  return id != null ? String(id) : null;
}

/** 6-digit boarding user number from populated userId. */
export function getParticipantUserNo(item) {
  const u = item?.userId ?? item?.user;
  if (!u || typeof u !== "object") return "";
  const no = u.userNo ?? u.user_no;
  return no != null ? String(no).trim() : "";
}
