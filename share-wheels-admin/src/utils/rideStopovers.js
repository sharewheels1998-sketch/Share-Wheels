const toCoord = (value) => {
  const lat = Number(value?.lat ?? value?.latitude);
  const lng = Number(value?.lng ?? value?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

/** Merge stopover rows from list + detail, preferring rows that have coordinates. */
export const mergeStopoverRows = (left = [], right = []) => {
  const rows = [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])];
  const byKey = new Map();

  rows.forEach((stop, index) => {
    const label = String(stop?.label || stop?.name || "").trim() || `Stop ${index + 1}`;
    const key = label.toLowerCase();
    const coords = toCoord(stop);
    const next = coords ? { label, lat: coords.lat, lng: coords.lng } : { label };

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, next);
      return;
    }
    if (coords && !toCoord(existing)) {
      byKey.set(key, next);
    }
  });

  return Array.from(byKey.values());
};

/**
 * Ensure every stopover has map coordinates.
 * Uses stored lat/lng when present; otherwise snaps to the planned route polyline.
 */
export const resolveStopoversForMap = (stopovers = [], plannedPath = []) => {
  const rows = Array.isArray(stopovers) ? stopovers : [];
  if (!rows.length) return [];

  const path = (Array.isArray(plannedPath) ? plannedPath : []).filter(
    (pt) => Number.isFinite(pt?.lat) && Number.isFinite(pt?.lng)
  );

  return rows
    .map((stop, index) => {
      const label = String(stop?.label || stop?.name || "").trim() || `Stop ${index + 1}`;
      let coords = toCoord(stop);

      if (!coords && path.length > 1) {
        const slot = Math.min(
          path.length - 1,
          Math.max(0, Math.round(((index + 1) * path.length) / (rows.length + 1)))
        );
        coords = { lat: path[slot].lat, lng: path[slot].lng };
      }

      if (!coords) return null;
      return { label, lat: coords.lat, lng: coords.lng, order: index };
    })
    .filter(Boolean);
};
