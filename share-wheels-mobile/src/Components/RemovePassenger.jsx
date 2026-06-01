import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import UserAvatar from "./ui/UserAvatar";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../theme/useThemedStyles";
import { getParticipantUserId } from "../Utils/participantIds";

const RemovePassengerModal = ({
  passenger,
  onRemove,
  onCancel,
  removing = false,
  rideFrom,
  showHandle = true,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const name = passenger?.userId?.name || "Passenger";
  const seats = passenger?.requires_seats || 1;

  const handleRemovePassenger = async () => {
    if (removing) return;
    const passengerId = getParticipantUserId(passenger);
    if (!passengerId) return;
    await onRemove(passengerId);
  };

  return (
    <View style={styles.container}>
      {showHandle ? <View style={styles.handle} /> : null}

      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Icon name="person-remove-outline" size={22} color={colors.errorText} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Remove passenger</Text>
          <Text style={styles.headerSub}>They will be notified and seats freed</Text>
        </View>
        {onCancel ? (
          <TouchableOpacity
            onPress={onCancel}
            hitSlop={12}
            style={styles.closeBtn}
            disabled={removing}
          >
            <Icon name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.card}>
        <UserAvatar user={passenger?.userId} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            <Icon name="layers-outline" size={14} color={colors.textMuted} />
            <Text style={styles.meta}>{seats} seat{seats === 1 ? "" : "s"}</Text>
          </View>
          {rideFrom ? (
            <View style={styles.metaRow}>
              <Icon name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.meta} numberOfLines={2}>
                {rideFrom}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.warningBox}>
        <Icon name="alert-circle" size={20} color={colors.errorText} />
        <Text style={styles.warningText}>
          This cannot be undone. The passenger will be removed from your ride.
        </Text>
      </View>

      <View style={styles.actions}>
        {onCancel ? (
          <TouchableOpacity
            style={[styles.cancelBtn, removing && styles.btnDisabled]}
            onPress={onCancel}
            disabled={removing}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelText}>Keep</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.removeBtn, removing && styles.btnDisabled]}
          onPress={handleRemovePassenger}
          disabled={removing}
          activeOpacity={0.85}
        >
          {removing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="trash-outline" size={18} color="#fff" />
              <Text style={styles.removeText}>Remove</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RemovePassengerModal;

const createStyles = (c) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 24,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: "center",
      marginBottom: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 18,
      gap: 12,
    },
    headerIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.errorBg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1 },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: c.text,
    },
    headerSub: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
      lineHeight: 18,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.chipBg,
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      flexDirection: "row",
      backgroundColor: c.surfaceAlt,
      padding: 14,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardBody: {
      flex: 1,
      marginLeft: 12,
    },
    name: {
      fontSize: 16,
      fontWeight: "700",
      color: c.text,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },
    meta: {
      flex: 1,
      fontSize: 13,
      color: c.textMuted,
      lineHeight: 18,
    },
    warningBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: c.errorBg,
      borderWidth: 1,
      borderColor: c.errorBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 18,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: c.errorText,
      lineHeight: 19,
      fontWeight: "500",
    },
    actions: {
      flexDirection: "row",
      gap: 10,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.chipBg,
      borderWidth: 1,
      borderColor: c.border,
    },
    cancelText: {
      color: c.text,
      fontSize: 15,
      fontWeight: "700",
    },
    removeBtn: {
      flex: 1.2,
      flexDirection: "row",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#DC2626",
    },
    removeText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    btnDisabled: {
      opacity: 0.55,
    },
  });
