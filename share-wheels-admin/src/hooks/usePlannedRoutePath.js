import { useEffect, useMemo, useState } from "react";
import { getAdminRouteDirections } from "../api/client";
import { decodePolyline } from "../utils/polyline";

const normalizeCoords = (coords) => {
  if (!coords) return null;
  const lat = Number(coords.lat ?? coords.latitude);
  const lng = Number(coords.lng ?? coords.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const serializeStopovers = (stopovers = []) =>
  JSON.stringify(
    (Array.isArray(stopovers) ? stopovers : []).map((stop) => ({
      label: String(stop?.label || stop?.name || "").trim(),
      lat: Number(stop?.lat ?? stop?.latitude),
      lng: Number(stop?.lng ?? stop?.longitude),
    }))
  );

const pathsEqual = (left = [], right = []) => {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i]?.lat !== right[i]?.lat || left[i]?.lng !== right[i]?.lng) return false;
  }
  return true;
};

const endpointsEqual = (left = {}, right = {}) => {
  const samePoint = (a, b) => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.lat === b.lat && a.lng === b.lng;
  };
  return samePoint(left.from, right.from) && samePoint(left.to, right.to);
};

/**
 * Loads planned driving route (Routes API) for admin map.
 * Uses ride coordinates when present; otherwise geocodes from/to place names.
 */
export function usePlannedRoutePath({
  fromCoords,
  toCoords,
  fromLabel,
  toLabel,
  savedPolyline = "",
  stopovers = [],
  enabled = true,
}) {
  const [plannedPath, setPlannedPath] = useState([]);
  const [endpoints, setEndpoints] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stopoversKey = useMemo(() => serializeStopovers(stopovers), [stopovers]);

  useEffect(() => {
    const from = normalizeCoords(fromCoords);
    const to = normalizeCoords(toCoords);
    const fromText = String(fromLabel || "").trim();
    const toText = String(toLabel || "").trim();
    const stored = String(savedPolyline || "").trim();

    if (!enabled || (!from && !fromText) || (!to && !toText)) {
      setPlannedPath((prev) => (prev.length ? [] : prev));
      setEndpoints((prev) => (prev.from || prev.to ? { from: null, to: null } : prev));
      setError((prev) => (prev ? "" : prev));
      return undefined;
    }

    if (stored) {
      const path = decodePolyline(stored);
      const nextPath = path.length > 1 ? path : [];
      const nextEndpoints = { from: from || null, to: to || null };

      setPlannedPath((prev) => (pathsEqual(prev, nextPath) ? prev : nextPath));
      setEndpoints((prev) => (endpointsEqual(prev, nextEndpoints) ? prev : nextEndpoints));
      setError((prev) => (prev ? "" : prev));
      setLoading((prev) => (prev ? false : prev));
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const params = {};
    if (from) {
      params.originLat = String(from.lat);
      params.originLng = String(from.lng);
    }
    if (to) {
      params.destLat = String(to.lat);
      params.destLng = String(to.lng);
    }
    if (fromText) params.from = fromText;
    if (toText) params.to = toText;
    if (Array.isArray(stopovers) && stopovers.length) {
      const waypoints = stopovers
        .map((stop) => ({
          lat: Number(stop?.lat ?? stop?.latitude),
          lng: Number(stop?.lng ?? stop?.longitude),
        }))
        .filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lng));
      if (waypoints.length) {
        params.waypoints = JSON.stringify(waypoints);
      }
    }

    getAdminRouteDirections(params)
      .then((res) => {
        if (cancelled) return;
        const path = res.polyline ? decodePolyline(res.polyline) : [];
        const nextPath = path.length > 1 ? path : [];
        const nextEndpoints = {
          from: res.origin ? { lat: res.origin.lat, lng: res.origin.lng, label: "Pickup" } : from,
          to: res.destination
            ? { lat: res.destination.lat, lng: res.destination.lng, label: "Destination" }
            : to,
        };
        setPlannedPath((prev) => (pathsEqual(prev, nextPath) ? prev : nextPath));
        setEndpoints((prev) => (endpointsEqual(prev, nextEndpoints) ? prev : nextEndpoints));
      })
      .catch((e) => {
        if (cancelled) return;
        const fallbackEndpoints = { from: from || null, to: to || null };
        setPlannedPath((prev) => (prev.length ? [] : prev));
        setEndpoints((prev) => (endpointsEqual(prev, fallbackEndpoints) ? prev : fallbackEndpoints));
        setError(e.message || "Could not load route");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    fromCoords?.lat,
    fromCoords?.lng,
    toCoords?.lat,
    toCoords?.lng,
    fromLabel,
    toLabel,
    savedPolyline,
    stopoversKey,
  ]);

  return { plannedPath, endpoints, loading, error };
}
