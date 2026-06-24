import appIcon from "../assets/app-icon.png";

export default function AdminLogo({ className = "h-11 w-11", alt = "Share Wheels" }) {
  return (
    <img
      src={appIcon}
      alt={alt}
      className={`shrink-0 rounded-2xl object-cover shadow-lg shadow-brand-600/20 ${className}`}
    />
  );
}
