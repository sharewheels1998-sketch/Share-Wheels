const Admin = require("../models/adminModel");const {
  ADMIN_MODULES,
  isSuperAdmin,
  normalizePermissions,
  serializeAdminPublic,
} = require("../constants/adminPermissions");

const listStaff = async () => {
  const staff = await Admin.find().sort({ createdAt: -1 }).lean();
  return {
    status: 200,
    body: {
      success: true,
      staff: staff.map((row) => serializeAdminPublic(row)),
    },
  };
};

const getStaffMeta = async () => ({
  status: 200,
  body: {
    success: true,
    modules: ADMIN_MODULES,
  },
});

const createStaff = async (actorId, body = {}) => {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const mobile = String(body.mobile || "").trim();
  const password = String(body.password || "");
  const permissions = normalizePermissions(body.permissions);

  if (!name || !email || !mobile || !password) {
    return { status: 400, body: { message: "Name, email, mobile, and password are required" } };
  }
  if (password.length < 6) {
    return { status: 400, body: { message: "Password must be at least 6 characters" } };
  }

  const exists = await Admin.findOne({ $or: [{ email }, { mobile }] });
  if (exists) {
    return { status: 409, body: { message: "An admin with this email or mobile already exists" } };
  }

  const admin = await Admin.create({
    name,
    email,
    mobile,
    password,
    role: "staff",
    permissions,
    createdBy: actorId,
  });

  return {
    status: 201,
    body: { success: true, staff: serializeAdminPublic(admin) },
  };
};

const updateStaff = async (actorId, staffId, body = {}) => {
  if (String(actorId) === String(staffId) && body.isActive === false) {
    return { status: 400, body: { message: "You cannot deactivate your own account" } };
  }

  const admin = await Admin.findById(staffId);
  if (!admin) return { status: 404, body: { message: "Staff member not found" } };

  if (isSuperAdmin(admin) && body.isActive === false) {
    return { status: 400, body: { message: "Super admin accounts cannot be deactivated" } };
  }

  if (body.name != null) admin.name = String(body.name).trim();
  if (body.mobile != null) admin.mobile = String(body.mobile).trim();
  if (body.isActive != null && !isSuperAdmin(admin)) admin.isActive = !!body.isActive;
  if (body.permissions != null && !isSuperAdmin(admin)) {
    admin.permissions = normalizePermissions(body.permissions);
  }

  if (body.password) {
    const password = String(body.password);
    if (password.length < 6) {
      return { status: 400, body: { message: "Password must be at least 6 characters" } };
    }
    admin.password = password;
  }

  if (body.email != null) {
    const email = String(body.email).trim().toLowerCase();
    const clash = await Admin.findOne({ email, _id: { $ne: admin._id } });
    if (clash) return { status: 409, body: { message: "Email already in use" } };
    admin.email = email;
  }

  await admin.save();

  return {
    status: 200,
    body: { success: true, staff: serializeAdminPublic(admin) },
  };
};

const deleteStaff = async (actorId, staffId) => {
  if (String(actorId) === String(staffId)) {
    return { status: 400, body: { message: "You cannot delete your own account" } };
  }

  const admin = await Admin.findById(staffId);
  if (!admin) return { status: 404, body: { message: "Staff member not found" } };

  if (isSuperAdmin(admin)) {
    return { status: 400, body: { message: "Super admin accounts cannot be deleted" } };
  }

  await Admin.findByIdAndDelete(staffId);
  return { status: 200, body: { success: true, message: "Staff member deleted" } };
};

module.exports = {
  listStaff,
  getStaffMeta,
  createStaff,
  updateStaff,
  deleteStaff,
};
