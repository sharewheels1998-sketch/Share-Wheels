const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const normalizeMobile = (mobile) =>
  String(mobile || "")
    .replace(/\D/g, "")
    .slice(-10);

const validateUserFields = ({
  name,
  email,
  mobile,
  gender,
  password,
  requirePassword = true,
}) => {
  if (!name?.trim()) {
    return { ok: false, message: "Name is required" };
  }
  const normalizedEmail = normalizeEmail(email);
  if (!EMAIL_RE.test(normalizedEmail)) {
    return { ok: false, message: "Invalid email address" };
  }
  const normalizedMobile = normalizeMobile(mobile);
  if (!MOBILE_RE.test(normalizedMobile)) {
    return { ok: false, message: "Enter a valid 10-digit Indian mobile number" };
  }
  if (!gender || !["male", "female", "other"].includes(gender)) {
    return { ok: false, message: "Gender must be male, female, or other" };
  }
  if (requirePassword) {
    if (!password || String(password).length < 6) {
      return { ok: false, message: "Password must be at least 6 characters" };
    }
  } else if (password != null && String(password).length > 0 && String(password).length < 6) {
    return { ok: false, message: "Password must be at least 6 characters" };
  }

  return {
    ok: true,
    name: name.trim(),
    email: normalizedEmail,
    mobile: normalizedMobile,
    gender,
    password: password != null ? String(password) : null,
  };
};

module.exports = {
  EMAIL_RE,
  MOBILE_RE,
  normalizeEmail,
  normalizeMobile,
  validateUserFields,
};
