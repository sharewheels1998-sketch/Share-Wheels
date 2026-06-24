import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../components/ui/PageHeader";
import Loading from "../components/ui/Loading";
import SearchInput from "../components/ui/SearchInput";
import AdminPageShell, { AdminTablePanel } from "../components/ui/AdminPageShell";
import Pagination from "../components/ui/Pagination";
import LeafletTrackingMap from "../components/maps/LeafletTrackingMap";
import UserTableCell from "../components/ui/UserTableCell";
import IconActionButton, { TableActions } from "../components/ui/IconActionButton";
import { IconMap } from "../components/ui/icons";
import { usePlannedRoutePath } from "../hooks/usePlannedRoutePath";
import { usePagination } from "../hooks/usePagination";
import {
  useAdminLiveTracking,
  normalizeTrackingLocation,
  normalizeRideRow,
  rideKey,
} from "../hooks/useAdminLiveTracking";
import { getTrackingDetail } from "../api/client";
import { mergeStopoverRows, resolveStopoversForMap } from "../utils/rideStopovers";
import { Alert, btnClass, ModalBackdrop, Table, Th, Td } from "../components/ui/primitives";

const normalizeCoords = (coords) => {
  if (!coords) return null;
  const lat = Number(coords.lat ?? coords.latitude);
  const lng = Number(coords.lng ?? coords.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const mapDetailToRideRow = (ride) => {
  if (!ride) return null;

  const participants = (ride.participants || []).map((p) => ({
    userId: String(p.userId ?? ""),
    role: p.role,
    name: p.name,
    location: normalizeTrackingLocation(
      p.location || { lat: p.lat, lng: p.lng, updatedAt: p.updatedAt }
    ),
  }));

  const path = (ride.liveTracking?.locationHistory || [])
    .map((pt) => {
      const lat = Number(pt.lat);
      const lng = Number(pt.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean);

  return normalizeRideRow({
    rideId: ride.rideId,
    from: ride.from,
    to: ride.to,
    fromCoords: ride.fromCoords || null,
    toCoords: ride.toCoords || null,
    routePolyline: ride.routePolyline || "",
    stopovers: ride.stopovers || [],
    status: ride.status,
    driver: ride.driver,
    passengerCount:
      ride.passengers?.length || participants.filter((p) => p.role === "passenger").length,
    location: normalizeTrackingLocation(ride.location),
    participants,
    path,
    isTracking: !!ride.liveTracking?.isActive,
  });
};

const mergeSelectedRide = (listRow, detailRow) => {
  if (!listRow && !detailRow) return null;
  if (!listRow) return detailRow;
  if (!detailRow) return listRow;

  return {
    ...detailRow,
    ...listRow,
    driver: listRow.driver || detailRow.driver,
    fromCoords: listRow.fromCoords || detailRow.fromCoords,
    toCoords: listRow.toCoords || detailRow.toCoords,
    routePolyline: listRow.routePolyline || detailRow.routePolyline,
    stopovers: mergeStopoverRows(listRow.stopovers, detailRow.stopovers),
    location: listRow.location || detailRow.location,
    participants: listRow.participants?.length ? listRow.participants : detailRow.participants,
    path:
      (listRow.path?.length || 0) >= (detailRow.path?.length || 0)
        ? listRow.path
        : detailRow.path,
  };
};

const collectMarkers = (ride, routeEndpoints = {}) => {
  const markers = [];
  const driverLoc = normalizeTrackingLocation(ride?.location);

  if (driverLoc) {
    markers.push({
      key: `${ride.rideId}-driver`,
      ...driverLoc,
      role: "driver",
      label: ride.driver?.name || "Driver",
    });
  }

  const participants = ride?.participants || [];
  participants.forEach((p, i) => {
    const loc = normalizeTrackingLocation(p.location || p);
    if (!loc) return;
    if (p.role === "driver" && driverLoc) return;
    markers.push({
      key: `${ride.rideId}-${p.userId || i}-${p.role}`,
      ...loc,
      role: p.role || "passenger",
      label: p.name || p.role,
    });
  });

  const rideId = ride?.rideId || "ride";
  if (routeEndpoints.from) {
    markers.push({
      key: `${rideId}-route-from`,
      lat: routeEndpoints.from.lat,
      lng: routeEndpoints.from.lng,
      role: "route-from",
      label: routeEndpoints.from.label || "Pickup",
    });
  }
  if (routeEndpoints.to) {
    markers.push({
      key: `${rideId}-route-to`,
      lat: routeEndpoints.to.lat,
      lng: routeEndpoints.to.lng,
      role: "route-to",
      label: routeEndpoints.to.label || "Destination",
    });
  }

  const stopovers = ride?.stopovers || [];
  stopovers.forEach((stop, index) => {
    const lat = Number(stop?.lat ?? stop?.latitude);
    const lng = Number(stop?.lng ?? stop?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    markers.push({
      key: `${rideId}-stopover-${index}`,
      lat,
      lng,
      role: "stopover",
      label: stop?.label || `Stop ${index + 1}`,
      order: stop?.order ?? index,
    });
  });

  return markers;
};

export default function LiveTracking() {
  const { rides, loading, error, socketConnected, refresh } = useAdminLiveTracking();
  const [selectedId, setSelectedId] = useState(null);
  const [detailRide, setDetailRide] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!selectedId) return undefined;

    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");

    getTrackingDetail(selectedId)
      .then((res) => {
        if (cancelled) return;
        setDetailRide(mapDetailToRideRow(res.ride));
      })
      .catch((err) => {
        if (cancelled) return;
        setDetailError(err.message || "Could not load ride tracking details");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const listRow = useMemo(
    () => rides.find((r) => rideKey(r.rideId) === rideKey(selectedId)) || null,
    [rides, selectedId]
  );

  const selectedRide = useMemo(() => {
    if (!selectedId) return null;
    return mergeSelectedRide(listRow, detailRide) || listRow || detailRide;
  }, [listRow, detailRide, selectedId]);

  const savedPolyline = selectedRide?.routePolyline || "";
  const routeStopovers = selectedRide?.stopovers || [];

  const { plannedPath, endpoints: routeEndpoints, error: routeError } = usePlannedRoutePath({
      fromCoords: selectedRide?.fromCoords || null,
      toCoords: selectedRide?.toCoords || null,
      fromLabel: selectedRide?.from || "",
      toLabel: selectedRide?.to || "",
      savedPolyline,
      stopovers: routeStopovers,
      enabled: !!selectedId && !!selectedRide,
    });

  const routeEndpointsResolved = useMemo(() => {
    if (routeEndpoints.from || routeEndpoints.to) return routeEndpoints;
    const from = normalizeCoords(selectedRide?.fromCoords);
    const to = normalizeCoords(selectedRide?.toCoords);
    return {
      from: from ? { ...from, label: selectedRide?.from || "Pickup" } : null,
      to: to ? { ...to, label: selectedRide?.to || "Destination" } : null,
    };
  }, [routeEndpoints, selectedRide]);

  const filteredRides = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rides;
    return rides.filter((r) => {
      const hay = `${r.from || ""} ${r.to || ""} ${r.driver?.name || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rides, search]);

  const { page, setPage, paginatedItems, totalPages, totalItems, pageSize } = usePagination(
    filteredRides,
    {
      pageSize: 10,
      resetDeps: [search],
    }
  );

  const gpsPath = useMemo(() => {
    const path = selectedRide?.path || [];
    return path
      .map((p) => {
        const lat = Number(p.lat);
        const lng = Number(p.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
      })
      .filter(Boolean);
  }, [selectedRide]);

  const stopovers = useMemo(
    () => resolveStopoversForMap(selectedRide?.stopovers, plannedPath),
    [selectedRide?.stopovers, plannedPath]
  );

  const mapMarkers = useMemo(() => {
    if (!selectedRide) return [];
    const rideForMap = { ...selectedRide, stopovers };
    return collectMarkers(rideForMap, routeEndpointsResolved);
  }, [selectedRide, stopovers, routeEndpointsResolved]);

  const handleViewOnMap = useCallback((rideId, e) => {
    e?.stopPropagation?.();
    setSelectedId(rideId);
  }, []);

  const handleCloseMap = useCallback(() => {
    setSelectedId(null);
    setDetailRide(null);
    setDetailError("");
    setDetailLoading(false);
  }, []);

  const liveParticipantCount = (ride) =>
    (ride.participants || []).filter((p) => normalizeTrackingLocation(p.location || p)).length;

  return (
    <AdminPageShell>
      <PageHeader
        compact
        title="Live ride tracking"
        subtitle="Active rides load in the table — click View map to open live GPS in a popover"
      />

      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
            socketConnected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${socketConnected ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          {socketConnected ? "Live socket connected" : "Connecting…"}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1D4ED8] ring-2 ring-white" /> Driver
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#059669] ring-2 ring-white" /> Passenger
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EA580C] ring-2 ring-white" /> Courier
        </span>
      </div>

      {error ? <Alert className="mb-3 shrink-0">{error}</Alert> : null}

      <div className="mb-3 flex shrink-0 flex-wrap gap-2">
        <SearchInput
          className="max-w-xs"
          placeholder="Search route or driver…"
          onDebouncedChange={setSearch}
        />
        <button type="button" className={btnClass("secondary", "sm")} onClick={refresh}>
          Refresh
        </button>
      </div>

      <AdminTablePanel>
        {loading && rides.length === 0 ? (
          <Loading message="Loading active rides…" className="flex-1 py-8" />
        ) : (
          <>
            <Table fill>
              <thead>
                <tr>
                  <Th sticky>Route</Th>
                  <Th sticky>Driver</Th>
                  <Th sticky>Status</Th>
                  <Th sticky>Live GPS</Th>
                  <Th sticky>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {totalItems === 0 ? (
                  <tr>
                    <Td colSpan={5} className="py-10 text-center text-slate-500">
                      No active rides match your search.
                    </Td>
                  </tr>
                ) : (
                  paginatedItems.map((r) => {
                    const active = rideKey(selectedId) === rideKey(r.rideId);
                    const hasGps = !!r.location;
                    const liveCount = liveParticipantCount(r);
                    return (
                      <tr
                        key={r.rideId}
                        className={active ? "bg-brand-50/80" : "hover:bg-slate-50/80"}
                      >
                        <Td>
                          <div className="font-semibold text-slate-800">{r.from}</div>
                          <div className="text-xs text-slate-500">→ {r.to}</div>
                        </Td>
                        <Td>
                          <UserTableCell
                            user={r.driver}
                            avatarSize="sm"
                            subtitle={r.driver?.mobile || undefined}
                          />
                        </Td>
                        <Td>
                          <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800">
                            {r.status || "started"}
                          </span>
                        </Td>
                        <Td>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              hasGps
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {hasGps ? "GPS on" : "Waiting"}
                          </span>
                          <div className="mt-1 text-[11px] text-slate-500">
                            {liveCount} live · {r.passengerCount ?? 0} pax
                          </div>
                        </Td>
                        <Td>
                          <TableActions>
                            <IconActionButton
                              icon={IconMap}
                              label="View on map"
                              variant={active ? "primary" : "secondary"}
                              onClick={(e) => handleViewOnMap(r.rideId, e)}
                            />
                          </TableActions>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </>
        )}
      </AdminTablePanel>

      {selectedId ? (
        <ModalBackdrop
          onClose={handleCloseMap}
          size="map"
          panelClassName="flex flex-col overflow-hidden p-0"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900">Live map</h3>
              {selectedRide ? (
                <>
                  <p className="truncate text-sm text-slate-500">
                    {selectedRide.from} → {selectedRide.to}
                    {selectedRide.driver?.name ? ` · ${selectedRide.driver.name}` : ""}
                  </p>
                  {stopovers.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {stopovers.map((stop, index) => (
                        <span
                          key={`${stop.label}-${index}`}
                          className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-800"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                            {index + 1}
                          </span>
                          {stop.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-slate-500">Loading ride locations…</p>
              )}
            </div>
            <button type="button" className={btnClass("secondary", "sm")} onClick={handleCloseMap}>
              Close
            </button>
          </div>

          {detailError ? <Alert className="mx-5 mt-4 shrink-0">{detailError}</Alert> : null}
          {routeError && selectedRide ? (
            <Alert className="mx-5 mt-4 shrink-0">Route: {routeError}</Alert>
          ) : null}

          <div className="relative w-full shrink-0" style={{ height: 560 }}>
            <LeafletTrackingMap
              markers={mapMarkers}
              plannedPath={plannedPath}
              gpsPath={gpsPath}
              fitSessionKey={selectedId || ""}
              resizeKey={`${selectedId}-${detailLoading ? "loading" : "ready"}`}
            />
            {detailLoading && mapMarkers.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                <Loading message="Loading ride GPS…" />
              </div>
            ) : null}
          </div>
        </ModalBackdrop>
      ) : null}
    </AdminPageShell>
  );
}
