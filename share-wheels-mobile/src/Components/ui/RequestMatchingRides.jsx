import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import UserAvatar from "./UserAvatar";
import { formatDisplayDate, formatRideTimeLabel } from "../../Utils/dateUtils";
import {
  LOOKUP_FALLBACKS,
  normalizeVehicleType,
} from "../../hooks/useLookupOptions";
import { useTheme } from "../../context/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { LAYOUT } from "../../theme/layout";

const formatVehicleTypeLabel = (ride) => {
  const type = normalizeVehicleType(ride?.vehicleType || ride?.vehicle?.type);
  if (!type) return "";
  return (
    LOOKUP_FALLBACKS.vehicle_type.find((o) => o.value === type)?.label ||
    type.charAt(0).toUpperCase() + type.slice(1)
  );
};

const MetaChip = ({ icon, label, styles, colors }) => (
  <View style={styles.metaChip}>
    <Icon name={icon} size={11} color={colors.textMuted} />
    <Text style={styles.metaChipText} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const RequestMatchingRides = ({
  rides = [],
  linkedRide = null,
  lockedRideId = null,
  role = "Passenger",
  joiningRideId = null,
  onViewRide,
  onJoinRide,
  emptyMessage,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isCourier = role === "Courier";
  const list = linkedRide
    ? [linkedRide, ...rides.filter((r) => String(r._id) !== String(linkedRide._id))]
    : rides;

  if (!list.length) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Icon name="car-outline" size={32} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No matching driver rides</Text>
        <Text style={styles.emptySub}>
          {emptyMessage ||
            "Try another date or check Home search for more options."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>
        {linkedRide ? "Your ride" : "Matching rides"}
      </Text>
      {list.map((ride) => {
        const rideId = String(ride._id);
        const isLinked =
          (linkedRide && rideId === String(linkedRide._id)) ||
          (lockedRideId && rideId === String(lockedRideId));
        const lockedElsewhere =
          lockedRideId && rideId !== String(lockedRideId);
        const pending = isCourier
          ? ride.courierRequestPending
          : ride.passengerRequestPending;
        const joinInFlight = !!joiningRideId;
        const busy = joinInFlight && String(joiningRideId) === rideId;
        const seats = ride.availableSeats ?? 1;
        const driverName = ride.creator?.name || "Driver";
        const vehicleTypeLabel = formatVehicleTypeLabel(ride);
        const vehicleDisplay = [
          vehicleTypeLabel || ride?.vehicle?.type,
          ride?.vehicle?.company,
          ride?.vehicle?.model,
        ]
          .map((part) => String(part || "").trim())
          .filter(Boolean)
          .join(" · ");
        const dateLabel =
          formatDisplayDate(ride.date, { weekday: false }) || "—";
        const timeLabel = formatRideTimeLabel(ride.date, ride.startTime) || "—";
        const accentStyle = isLinked
          ? styles.cardAccentLinked
          : lockedElsewhere
            ? styles.cardAccentBlocked
            : styles.cardAccentDefault;

        return (
          <View key={rideId} style={styles.cardOuter}>
            <View style={[styles.cardAccent, accentStyle]} />

            <View style={styles.cardBody}>
              <View style={styles.topRow}>
                <UserAvatar
                  user={ride.creator}
                  size={46}
                  borderColor={colors.border}
                />
                <View style={styles.topCenter}>
                  <Text style={styles.driverName} numberOfLines={1}>
                    {driverName}
                  </Text>
                  <Text style={styles.vehicleText} numberOfLines={1}>
                    {vehicleDisplay || "Vehicle details on request"}
                    {ride?.vehicle?.car_no ? ` · ${ride.vehicle.car_no}` : ""}
                  </Text>
                </View>
              </View>

              <View style={styles.tagRow}>
                {isLinked ? (
                  <View style={[styles.tag, styles.tagLinked]}>
                    <Icon
                      name={pending ? "time-outline" : "checkmark-circle"}
                      size={11}
                      color={colors.primary}
                    />
                    <Text style={[styles.tagText, { color: colors.primary }]}>
                      {pending ? "Pending" : "Joined"}
                    </Text>
                  </View>
                ) : lockedElsewhere ? (
                  <View style={[styles.tag, styles.tagBlocked]}>
                    <Icon name="lock-closed" size={11} color={colors.warningText} />
                    <Text style={[styles.tagText, { color: colors.warningText }]}>
                      Other driver
                    </Text>
                  </View>
                ) : null}
                {ride.QuickReserve ? (
                  <View style={[styles.tag, styles.tagSuccess]}>
                    <Icon name="flash" size={11} color={colors.successText} />
                    <Text style={[styles.tagText, { color: colors.successText }]}>
                      Quick
                    </Text>
                  </View>
                ) : null}
                {ride.CanCarryCourier && isCourier ? (
                  <View style={[styles.tag, styles.tagWarning]}>
                    <Icon name="cube-outline" size={11} color={colors.warningText} />
                    <Text style={[styles.tagText, { color: colors.warningText }]}>
                      Courier OK
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.routePanel}>
                <View style={styles.routeBlock}>
                  <View style={styles.routeTimeline}>
                    <View style={[styles.routeDot, styles.routeDotFrom]} />
                    <View style={styles.routeLine} />
                    <View style={[styles.routeDot, styles.routeDotTo]} />
                  </View>
                  <View style={styles.routeTextCol}>
                    <View style={styles.routePoint}>
                      <Text style={styles.routeLabel}>Pickup</Text>
                      <Text style={styles.routeCity} numberOfLines={2}>
                        {ride.from || "—"}
                      </Text>
                    </View>
                    <View style={[styles.routePoint, styles.routePointLast]}>
                      <Text style={styles.routeLabel}>Drop-off</Text>
                      <Text style={styles.routeCity} numberOfLines={2}>
                        {ride.to || "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.metaRow}>
                <MetaChip
                  icon="calendar-outline"
                  label={dateLabel}
                  styles={styles}
                  colors={colors}
                />
                <MetaChip
                  icon="time-outline"
                  label={timeLabel}
                  styles={styles}
                  colors={colors}
                />
                <MetaChip
                  icon="people-outline"
                  label={`${seats} seat${seats !== 1 ? "s" : ""}`}
                  styles={styles}
                  colors={colors}
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => onViewRide?.(ride)}
                  activeOpacity={0.85}
                >
                  <Icon name="eye-outline" size={16} color={colors.primary} />
                  <Text style={styles.secondaryBtnText}>View ride</Text>
                </TouchableOpacity>

                {pending ? (
                  <View style={styles.pendingPill}>
                    <Icon name="hourglass-outline" size={14} color={colors.warningText} />
                    <Text style={styles.pendingText}>Request pending</Text>
                  </View>
                ) : isLinked ? null : lockedElsewhere ? (
                  <View style={styles.blockedPill}>
                    <Icon name="lock-closed-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.blockedText}>Another driver</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      joinInFlight && styles.primaryBtnDisabled,
                    ]}
                    onPress={() => onJoinRide?.(ride)}
                    disabled={joinInFlight}
                    activeOpacity={0.85}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={colors.inverseText} />
                    ) : (
                      <>
                        <Icon
                          name={isCourier ? "cube" : "person-add"}
                          size={16}
                          color={colors.inverseText}
                        />
                        <Text style={styles.primaryBtnText}>
                          {joinInFlight
                            ? "Please wait…"
                            : isCourier
                              ? "Request courier"
                              : "Request seat"}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default RequestMatchingRides;

const createStyles = (c) =>
  StyleSheet.create({
    wrap: {
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "800",
      color: c.textMuted,
      marginBottom: LAYOUT.spacing.sm,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    cardOuter: {
      marginBottom: LAYOUT.spacing.md,
      borderRadius: LAYOUT.radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: "hidden",
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
    cardAccent: {
      height: 4,
      width: "100%",
    },
    cardAccentDefault: {
      backgroundColor: c.primary,
    },
    cardAccentLinked: {
      backgroundColor: c.successText || "#10B981",
    },
    cardAccentBlocked: {
      backgroundColor: c.warningText || "#F59E0B",
    },
    cardBody: {
      padding: LAYOUT.spacing.md,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    topCenter: {
      flex: 1,
      minWidth: 0,
    },
    driverName: {
      fontSize: LAYOUT.font.body,
      fontWeight: "800",
      color: c.text,
    },
    vehicleText: {
      fontSize: LAYOUT.font.small,
      color: c.textMuted,
      marginTop: 2,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 10,
      minHeight: 0,
    },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
    },
    tagLinked: {
      backgroundColor: c.primaryMuted,
    },
    tagBlocked: {
      backgroundColor: c.warningBg,
    },
    tagSuccess: {
      backgroundColor: c.successBg,
    },
    tagWarning: {
      backgroundColor: c.warningBg,
    },
    tagText: {
      fontSize: 10,
      fontWeight: "700",
    },
    routePanel: {
      backgroundColor: c.chipBg,
      borderRadius: LAYOUT.radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: 10,
      marginBottom: 10,
    },
    routeBlock: {
      flexDirection: "row",
      alignItems: "stretch",
    },
    routeTimeline: {
      alignItems: "center",
      width: 14,
      paddingTop: 4,
    },
    routeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: c.surface,
    },
    routeDotFrom: {
      backgroundColor: "#22C55E",
    },
    routeDotTo: {
      backgroundColor: "#EF4444",
    },
    routeLine: {
      width: 2,
      flex: 1,
      minHeight: 22,
      backgroundColor: c.border,
      marginVertical: 3,
    },
    routeTextCol: {
      flex: 1,
      marginLeft: 10,
    },
    routePoint: {
      marginBottom: 10,
    },
    routePointLast: {
      marginBottom: 0,
    },
    routeLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.35,
      marginBottom: 2,
    },
    routeCity: {
      fontSize: 13,
      fontWeight: "600",
      color: c.text,
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    metaChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.chipBg,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor: c.border,
    },
    metaChipText: {
      fontSize: 11,
      fontWeight: "600",
      color: c.textSecondary,
      maxWidth: 120,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: LAYOUT.radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    secondaryBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: c.primary,
    },
    primaryBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: c.primary,
      paddingVertical: 10,
      borderRadius: LAYOUT.radius.sm,
      minHeight: 40,
    },
    primaryBtnDisabled: {
      opacity: 0.7,
    },
    primaryBtnText: {
      color: c.inverseText,
      fontSize: 13,
      fontWeight: "800",
    },
    pendingPill: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: c.warningBg,
      paddingVertical: 10,
      borderRadius: LAYOUT.radius.sm,
      borderWidth: 1,
      borderColor: c.warningBorder,
    },
    pendingText: {
      fontSize: 12,
      fontWeight: "700",
      color: c.warningText,
    },
    blockedPill: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      backgroundColor: c.chipBg,
      paddingVertical: 10,
      borderRadius: LAYOUT.radius.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    blockedText: {
      fontSize: 12,
      fontWeight: "700",
      color: c.textMuted,
    },
    emptyWrap: {
      alignItems: "center",
      paddingVertical: 28,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
      borderRadius: LAYOUT.radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.primaryMuted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: c.text,
    },
    emptySub: {
      marginTop: 6,
      fontSize: 13,
      color: c.textMuted,
      textAlign: "center",
      lineHeight: 18,
    },
  });
