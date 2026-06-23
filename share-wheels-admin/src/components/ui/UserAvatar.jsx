import { useState } from "react";
import { getProfileImageUri, userInitials } from "../../utils/profileImage";

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 48,
};

export default function UserAvatar({ user, name, size = "md", className = "" }) {
  const [broken, setBroken] = useState(false);
  const px = typeof size === "number" ? size : SIZE_MAP[size] || SIZE_MAP.md;
  const displayName = name || user?.name || "";
  const uri = broken ? null : getProfileImageUri(user);
  const initials = userInitials(displayName);

  if (uri) {
    return (
      <img
        src={uri}
        alt={displayName ? `${displayName} profile` : "Profile"}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
        style={{ width: px, height: px }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-violet text-xs font-bold text-white ring-2 ring-white ${className}`}
      style={{ width: px, height: px, fontSize: Math.max(10, Math.round(px * 0.34)) }}
      aria-hidden={!displayName}
    >
      {initials}
    </span>
  );
}
