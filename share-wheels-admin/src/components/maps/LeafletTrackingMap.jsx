import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ADMIN_LINE_THEME, ADMIN_MAP_THEME } from "./mapMarkerIcons";

const DEFAULT_CENTER = [17.385, 78.4867];

const makeRoleIcon = (role, order = 0) => {
  const color = ADMIN_MAP_THEME[role]?.color || "#64748b";
  if (role === "stopover") {
    const num = order + 1;
    return L.divIcon({
      className: "sw-admin-leaflet-marker",
      html: `<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.35);color:#fff;font-size:11px;font-weight:700">${num}</span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }
  const size = role === "driver" ? 16 : 14;
  return L.divIcon({
    className: "sw-admin-leaflet-marker",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,.35)"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function InvalidateSize({ resizeKey }) {
  const map = useMap();

  useEffect(() => {
    if (!resizeKey) return undefined;
    const run = () => {
      map.invalidateSize({ animate: false });
    };
    run();
    const timers = [120, 350, 700].map((ms) => window.setTimeout(run, ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [map, resizeKey]);

  return null;
}

function FitBoundsHandler({ points, fitSessionKey }) {
  const map = useMap();
  const fittedRef = useRef("");

  useEffect(() => {
    if (!fitSessionKey || !points.length) return;
    const fitKey = `${fitSessionKey}:${points.length}`;
    if (fittedRef.current === fitKey) return;
    fittedRef.current = fitKey;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14, { animate: false });
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: false });
  }, [map, fitSessionKey, points]);

  return null;
}

const MapLegend = () => (
  <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[min(100%,320px)] rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Map legend</p>
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] font-semibold text-slate-700">
      {Object.entries(ADMIN_MAP_THEME).map(([role, meta]) => (
        <span key={role} className="inline-flex items-center gap-1">
          <span
            className="h-3 w-3 rounded-full ring-2 ring-white"
            style={{ backgroundColor: meta.color }}
          />
          {role === "route-from"
            ? "Start"
            : role === "route-to"
              ? "End"
              : role === "stopover"
                ? "Stopover"
                : role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      ))}
    </div>
  </div>
);

export default function LeafletTrackingMap({
  markers = [],
  plannedPath = [],
  gpsPath = [],
  fitSessionKey = "",
  resizeKey = "",
}) {
  const validMarkers = useMemo(
    () =>
      markers.filter(
        (m) => Number.isFinite(m.lat) && Number.isFinite(m.lng)
      ),
    [markers]
  );

  const fitPoints = useMemo(
    () => validMarkers.map((m) => ({ lat: m.lat, lng: m.lng })),
    [validMarkers]
  );

  const center = useMemo(() => {
    if (fitPoints.length) return [fitPoints[0].lat, fitPoints[0].lng];
    return DEFAULT_CENTER;
  }, [fitPoints, fitSessionKey]);

  const plannedPositions = useMemo(
    () =>
      plannedPath
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => [p.lat, p.lng]),
    [plannedPath]
  );

  const gpsPositions = useMemo(
    () =>
      gpsPath
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .map((p) => [p.lat, p.lng]),
    [gpsPath]
  );

  return (
    <div className="relative h-full w-full bg-slate-100">
      <MapContainer
        key={fitSessionKey || "map"}
        center={center}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom
        style={{ height: "100%", width: "100%", minHeight: 360 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSize resizeKey={resizeKey || fitSessionKey} />
        <FitBoundsHandler points={fitPoints} fitSessionKey={fitSessionKey} />

        {validMarkers.map((m) => (
          <Marker
            key={m.key}
            position={[m.lat, m.lng]}
            icon={makeRoleIcon(m.role, m.order)}
            zIndexOffset={
              m.role === "driver" ? 500 : m.role === "stopover" ? 460 : 400
            }
          >
            <Popup>
              <span className="text-sm font-semibold">{m.label}</span>
              <span className="mt-0.5 block text-xs capitalize text-slate-500">
                {m.role === "stopover" ? "Stopover" : m.role}
              </span>
            </Popup>
          </Marker>
        ))}

        {plannedPositions.length > 1 ? (
          <>
            <Polyline
              positions={plannedPositions}
              pathOptions={{
                color: ADMIN_LINE_THEME.plannedOutline.color,
                weight: ADMIN_LINE_THEME.plannedOutline.weight,
                opacity: ADMIN_LINE_THEME.plannedOutline.opacity,
              }}
            />
            <Polyline
              positions={plannedPositions}
              pathOptions={{
                color: ADMIN_LINE_THEME.planned.color,
                weight: ADMIN_LINE_THEME.planned.weight,
                opacity: ADMIN_LINE_THEME.planned.opacity,
              }}
            />
          </>
        ) : null}

        {gpsPositions.length > 1 ? (
          <>
            <Polyline
              positions={gpsPositions}
              pathOptions={{
                color: ADMIN_LINE_THEME.gpsOutline.color,
                weight: ADMIN_LINE_THEME.gpsOutline.weight,
                opacity: ADMIN_LINE_THEME.gpsOutline.opacity,
              }}
            />
            <Polyline
              positions={gpsPositions}
              pathOptions={{
                color: ADMIN_LINE_THEME.gps.color,
                weight: ADMIN_LINE_THEME.gps.weight,
                opacity: ADMIN_LINE_THEME.gps.opacity,
              }}
            />
          </>
        ) : null}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
