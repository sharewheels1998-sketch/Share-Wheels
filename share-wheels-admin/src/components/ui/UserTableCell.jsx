import UserAvatar from "./UserAvatar";

export default function UserTableCell({
  user,
  name,
  subtitle,
  meta,
  avatarSize = "md",
  className = "",
}) {
  const displayName = name || user?.name || "—";

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <UserAvatar user={user} name={displayName} size={avatarSize} />
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-800 dark:text-slate-100">{displayName}</div>
        {subtitle ? <div className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
        {meta ? <div className="truncate text-[10px] text-slate-400 dark:text-slate-500">{meta}</div> : null}
      </div>
    </div>
  );
}
