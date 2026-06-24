/**
 * Themed in-app alerts and toasts. Register via AppAlertProvider in App.jsx.
 * Installs a global Alert.alert override when the bridge is active.
 */

let bridge = null;
let nativeAlertInstalled = false;
let originalAlert = null;

const inferVariant = (title = "", message = "") => {
  const text = `${title} ${message}`.toLowerCase();
  if (
    /error|failed|could not|cannot|invalid|denied|unavailable|something went wrong/.test(
      text
    )
  ) {
    return "error";
  }
  if (/success|updated|done|activated|confirmed|saved|sent|removed/.test(text)) {
    return "success";
  }
  if (/confirm|are you sure|warning|check your|please wait|cancel/.test(text)) {
    return "warning";
  }
  return "info";
};

export const registerAppAlertBridge = (handlers) => {
  bridge = handlers;
  installThemedAlertOverride();
};

export const unregisterAppAlertBridge = () => {
  bridge = null;
  if (nativeAlertInstalled && originalAlert) {
    const { Alert } = require("react-native");
    Alert.alert = originalAlert;
    nativeAlertInstalled = false;
  }
};

export function installThemedAlertOverride() {
  if (nativeAlertInstalled || !bridge?.showAlert) return;
  const { Alert } = require("react-native");
  originalAlert = Alert.alert.bind(Alert);
  Alert.alert = (title, message, buttons, options) => {
    if (bridge?.showAlert) {
      const variant =
        options?.variant || inferVariant(String(title || ""), String(message || ""));
      bridge.showAlert({
        title: title || "Notice",
        message: message || "",
        buttons,
        variant,
      });
      return;
    }
    originalAlert(title, message, buttons, options);
  };
  nativeAlertInstalled = true;
}

/**
 * @param {string} title
 * @param {string} [message]
 * @param {Array<{text: string, onPress?: () => void, style?: string}>} [buttons]
 * @param {'info'|'success'|'warning'|'error'} [variant]
 */
export const showAppAlert = (title, message = "", buttons, variant = "info") => {
  if (bridge?.showAlert) {
    bridge.showAlert({ title, message, buttons, variant });
    return;
  }
  const { Alert } = require("react-native");
  Alert.alert(title, message, buttons);
};

export const showAppToast = (message, variant = "info", durationMs) => {
  if (bridge?.showToast) {
    bridge.showToast({ message, variant, durationMs });
    return;
  }
};

export const alertValidation = (message) =>
  showAppAlert("Check your details", message, [{ text: "OK" }], "warning");

export const alertError = (message, title = "Something went wrong") =>
  showAppAlert(title, message, [{ text: "OK" }], "error");

export const alertSuccess = (message, title = "Done") =>
  showAppAlert(title, message, [{ text: "OK" }], "success");
