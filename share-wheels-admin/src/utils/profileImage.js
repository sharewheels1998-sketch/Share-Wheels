export function getProfileImageUri(user) {
  if (!user) return null;

  const candidates = [
    user.profile_img,
    user.userimg,
    user.profile,
    user.profileImage,
    user.avatar,
    typeof user === "string" ? user : null,
  ];

  for (const value of candidates) {
    const trimmed = String(value || "").trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:image")) {
      return trimmed;
    }
  }
  return null;
}

export function userInitials(name, fallback = "?") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
