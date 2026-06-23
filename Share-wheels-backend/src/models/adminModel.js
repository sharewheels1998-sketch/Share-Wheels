const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { normalizePermissions } = require("../constants/adminPermissions");

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    mobile: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "staff"],
      default: "staff",
    },
    isActive: { type: Boolean, default: true },
    permissions: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.pre("save", function normalizePermissionShape() {
  if (this.isModified("permissions") && this.role !== "super_admin") {
    this.permissions = normalizePermissions(this.permissions);
  }
});

module.exports = mongoose.model("Admin", adminSchema);
