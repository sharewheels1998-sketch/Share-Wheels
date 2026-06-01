import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../theme/useThemedStyles";

const VerifyBoardingPanel = ({
  participantName,
  role = "passenger",
  userNo = "",
  onVerify,
  onCancel,
  verifying = false,
  showHeader = true,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userNoValue, setUserNoValue] = useState(userNo || "");
  const inputs = useRef([]);
  const submittingRef = useRef(false);

  useEffect(() => {
    setUserNoValue(userNo || "");
    setOtp(["", "", "", ""]);
    submittingRef.current = false;
  }, [userNo, participantName]);

  const submit = useCallback(
    async (otpDigits) => {
      if (submittingRef.current || verifying) return;
      const finalOtp = (otpDigits || otp.join("")).trim();
      const normalizedUserNo = userNoValue.trim();

      if (!/^\d{6}$/.test(normalizedUserNo)) {
        Alert.alert("User ID required", "Enter the participant's 6-digit User ID.");
        return;
      }
      if (!/^\d{4}$/.test(finalOtp)) {
        Alert.alert("OTP required", "Enter the 4-digit boarding OTP.");
        return;
      }

      submittingRef.current = true;
      try {
        await onVerify?.({ userNo: normalizedUserNo, otp: finalOtp });
      } finally {
        submittingRef.current = false;
      }
    },
    [otp, userNoValue, onVerify, verifying]
  );

  const handleOtpChange = (value, index) => {
    if (verifying || !/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    if (index === 3 && value) {
      submit([...newOtp].join(""));
    }
  };

  const roleLabel = role === "courier" ? "Courier" : "Passenger";

  return (
    <KeyboardAvoidingView
      style={styles.keyboardRoot}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      {showHeader ? <View style={styles.handle} /> : null}

      {showHeader ? (
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="shield-checkmark" size={22} color={colors.successText} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Verify boarding</Text>
            <Text style={styles.subtitle}>
              {roleLabel} · ask for User ID & OTP
            </Text>
          </View>
          {onCancel ? (
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={12}
              style={styles.cancelIconBtn}
              disabled={verifying}
            >
              <Icon name="arrow-back" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={styles.nameCard}>
        <Text style={styles.nameLabel}>Verifying</Text>
        <Text style={styles.name}>{participantName || roleLabel}</Text>
      </View>

      <Text style={styles.fieldLabel}>User ID (6 digits)</Text>
      <TextInput
        style={styles.userNoInput}
        keyboardType="number-pad"
        maxLength={6}
        value={userNoValue}
        editable={!verifying}
        onChangeText={(t) => setUserNoValue(t.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={styles.fieldLabel}>Boarding OTP (4 digits)</Text>
      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputs.current[index] = ref;
            }}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            editable={!verifying}
            onChangeText={(val) => handleOtpChange(val, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace" && !digit && index > 0) {
                inputs.current[index - 1]?.focus();
              }
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.verifyBtn, verifying && styles.btnDisabled]}
        onPress={() => submit()}
        disabled={verifying}
        activeOpacity={0.88}
      >
        {verifying ? (
          <ActivityIndicator color={colors.inverseText} />
        ) : (
          <>
            <Icon name="checkmark-circle" size={20} color={colors.inverseText} />
            <Text style={styles.verifyBtnText}>Confirm pickup</Text>
          </>
        )}
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VerifyBoardingPanel;

const createStyles = (c) =>
  StyleSheet.create({
    keyboardRoot: {
      flexGrow: 1,
    },
    scroll: {
      flexGrow: 1,
    },
    container: {
      paddingHorizontal: 20,
      paddingTop: 8,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: "center",
      marginBottom: 14,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 16,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: c.successBg,
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: { flex: 1 },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: c.text,
    },
    subtitle: {
      fontSize: 13,
      color: c.textMuted,
      marginTop: 4,
    },
    cancelIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.chipBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
    },
    nameCard: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.border,
    },
    nameLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    name: {
      fontSize: 17,
      fontWeight: "800",
      color: c.text,
      marginTop: 4,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: c.textSecondary,
      marginBottom: 8,
    },
    userNoInput: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 20,
      letterSpacing: 4,
      fontWeight: "700",
      color: c.text,
      backgroundColor: c.inputBg,
      marginBottom: 14,
      textAlign: "center",
    },
    otpRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
      marginBottom: 16,
    },
    otpBox: {
      width: 52,
      height: 56,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 14,
      textAlign: "center",
      fontSize: 22,
      fontWeight: "800",
      color: c.text,
      backgroundColor: c.inputBg,
    },
    verifyBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: c.primary,
      paddingVertical: 15,
      borderRadius: 14,
    },
    verifyBtnText: {
      color: c.inverseText,
      fontSize: 16,
      fontWeight: "800",
    },
    btnDisabled: {
      opacity: 0.65,
    },
  });
