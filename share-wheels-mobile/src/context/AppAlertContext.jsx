import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "./ThemeContext";
import {
  registerAppAlertBridge,
  unregisterAppAlertBridge,
} from "../Utils/appAlert";
import { DS } from "../theme/designSystem";

const AppAlertContext = createContext(null);

const VARIANT_META = {
  info: { icon: "information-circle", accentKey: "info" },
  success: { icon: "checkmark-circle", accentKey: "success" },
  warning: { icon: "warning", accentKey: "warning" },
  error: { icon: "alert-circle", accentKey: "error" },
};

const TOAST_DURATION_MS = 3600;

export const AppAlertProvider = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const dialogScale = useRef(new Animated.Value(0.92)).current;
  const dialogOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);

  const dismissToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.timing(toastOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setToast(null));
  }, [toastOpacity]);

  const showToast = useCallback(
    ({ message, variant = "info", durationMs = TOAST_DURATION_MS }) => {
      if (!message) return;
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, variant });
      toastOpacity.setValue(0);
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
      toastTimer.current = setTimeout(dismissToast, durationMs);
    },
    [dismissToast, toastOpacity]
  );

  const showAlert = useCallback(({ title, message, buttons, variant = "info" }) => {
    const normalized =
      Array.isArray(buttons) && buttons.length ? buttons : [{ text: "OK" }];
    setDialog({
      title: title || "Notice",
      message: message || "",
      buttons: normalized,
      variant,
    });
  }, []);

  useEffect(() => {
    registerAppAlertBridge({ showAlert, showToast });
    return () => unregisterAppAlertBridge();
  }, [showAlert, showToast]);

  useEffect(() => {
    if (!dialog) {
      dialogScale.setValue(0.92);
      dialogOpacity.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(dialogScale, {
        toValue: 1,
        damping: 16,
        stiffness: 220,
        useNativeDriver: true,
      }),
      Animated.timing(dialogOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dialog, dialogScale, dialogOpacity]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  const value = useMemo(
    () => ({ showAlert, showToast, closeDialog }),
    [showAlert, showToast, closeDialog]
  );

  const dialogVariant = dialog?.variant || "info";
  const meta = VARIANT_META[dialogVariant] || VARIANT_META.info;
  const accent = {
    info: { bg: colors.infoBg, text: colors.infoText, border: colors.primary },
    success: { bg: colors.successBg, text: colors.successText, border: colors.successText },
    warning: { bg: colors.warningBg, text: colors.warningText, border: colors.warningBorder },
    error: { bg: colors.errorBg, text: colors.errorText, border: colors.errorBorder },
  }[meta.accentKey];

  const toastMeta = VARIANT_META[toast?.variant || "info"] || VARIANT_META.info;
  const toastAccent = {
    info: { bg: colors.infoBg, text: colors.infoText },
    success: { bg: colors.successBg, text: colors.successText },
    warning: { bg: colors.warningBg, text: colors.warningText },
    error: { bg: colors.errorBg, text: colors.errorText },
  }[toastMeta.accentKey];

  const buttonRow =
    dialog?.buttons?.length === 2 &&
    dialog.buttons.some((b) => b.style === "cancel");

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <Modal
        visible={!!dialog}
        transparent
        animationType="none"
        onRequestClose={closeDialog}
        statusBarTranslucent
      >
        <Animated.View style={[styles.backdrop, { opacity: dialogOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDialog} />
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                transform: [{ scale: dialogScale }],
              },
            ]}
          >
            <View style={[styles.accentBar, { backgroundColor: accent.border }]} />
            <View style={[styles.iconWrap, { backgroundColor: accent.bg }]}>
              <Icon name={meta.icon} size={30} color={accent.text} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{dialog?.title}</Text>
            {dialog?.message ? (
              <Text style={[styles.message, { color: colors.textMuted }]}>
                {dialog.message}
              </Text>
            ) : null}
            <View style={[styles.actions, buttonRow && styles.actionsRow]}>
              {dialog?.buttons?.map((btn, idx) => {
                const isCancel = btn.style === "cancel";
                const isDestructive = btn.style === "destructive";
                return (
                  <TouchableOpacity
                    key={`${btn.text}-${idx}`}
                    style={[
                      styles.actionBtn,
                      buttonRow && styles.actionBtnHalf,
                      isCancel && {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.border,
                      },
                      !isCancel && {
                        backgroundColor: isDestructive ? colors.errorBg : colors.primary,
                        borderColor: isDestructive ? colors.errorBorder : colors.primary,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      closeDialog();
                      btn.onPress?.();
                    }}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: isCancel
                            ? colors.text
                            : isDestructive
                              ? colors.errorText
                              : colors.inverseText,
                        },
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.toastWrap,
            {
              top: insets.top + (Platform.OS === "android" ? 10 : 6),
              opacity: toastOpacity,
              transform: [
                {
                  translateY: toastOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={dismissToast}
            style={[
              styles.toast,
              {
                backgroundColor: colors.surface,
                borderColor: toastAccent.text + "44",
              },
            ]}
          >
            <View style={[styles.toastIcon, { backgroundColor: toastAccent.bg }]}>
              <Icon
                name={(VARIANT_META[toast.variant] || VARIANT_META.info).icon}
                size={20}
                color={toastAccent.text}
              />
            </View>
            <Text style={[styles.toastText, { color: colors.text }]}>
              {toast.message}
            </Text>
            <Icon name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </AppAlertContext.Provider>
  );
};

export const useAppAlert = () => {
  const ctx = useContext(AppAlertContext);
  if (!ctx) {
    throw new Error("useAppAlert must be used within AppAlertProvider");
  }
  return ctx;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    padding: DS.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: DS.spacing.lg,
    paddingBottom: DS.spacing.lg,
    paddingTop: DS.spacing.md,
    alignItems: "center",
    overflow: "hidden",
    ...DS.shadow.card,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: DS.spacing.sm,
    marginBottom: DS.spacing.md,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: DS.spacing.sm,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: DS.font.body,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: DS.spacing.lg,
    paddingHorizontal: 4,
  },
  actions: {
    width: "100%",
    gap: DS.spacing.sm,
  },
  actionsRow: {
    flexDirection: "row",
  },
  actionBtn: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DS.spacing.md,
  },
  actionBtnHalf: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
  },
  toastWrap: {
    position: "absolute",
    left: DS.spacing.md,
    right: DS.spacing.md,
    zIndex: 9999,
    elevation: 16,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...DS.shadow.card,
  },
  toastIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: {
    flex: 1,
    fontSize: DS.font.label,
    fontWeight: "600",
    lineHeight: 20,
  },
});
