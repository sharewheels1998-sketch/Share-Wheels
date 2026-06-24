const jwt = require("jsonwebtoken");
const { JWT_EXPIRES_IN } = require("../config/jwt");
const bcrypt = require("bcryptjs");
const Admin = require("../models/adminModel");
const { serializeAdminPublic } = require("../constants/adminPermissions");

const register = async ({ name, email, mobile, password }) => {
  const adminCount = await Admin.countDocuments();
  if (adminCount > 0) {
    return {
      status: 403,
      body: {
        message:
          "Bootstrap admin already exists. Ask a super admin to create staff accounts.",
      },
    };
  }
  const exists = await Admin.findOne({ $or: [{ email }, { mobile }] });
  if (exists) return { status: 400, body: { message: "Admin already exists" } };
  const admin = await Admin.create({
    name,
    email,
    mobile,
    password,
    role: "super_admin",
  });
  return {
    status: 200,
    body: { message: "Admin registered successfully", adminId: admin._id },
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) return { status: 400, body: { message: "Email & password required" } };
  const normalizedEmail = String(email).trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail });
  if (!admin) {
    const hint = process.env.ADMIN_EMAIL
      ? ` Use ADMIN_EMAIL from .env: ${process.env.ADMIN_EMAIL.trim().toLowerCase()}`
      : "";
    return { status: 404, body: { message: `Admin not found.${hint}` } };
  }
  if (admin.isActive === false) {
    return { status: 403, body: { message: "This admin account is deactivated" } };
  }
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return { status: 401, body: { message: "Invalid credentials" } };
  const token = jwt.sign(
    { id: admin._id, role: "admin", adminRole: admin.role || "staff" },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return {
    status: 200,
    body: {
      message: "Admin login successful",
      token,
      admin: serializeAdminPublic(admin),
    },
  };
};

const getCurrentAdmin = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) return { status: 404, body: { message: "Admin not found" } };
  return { status: 200, body: { success: true, admin: serializeAdminPublic(admin) } };
};

module.exports = { register, login, getCurrentAdmin };
