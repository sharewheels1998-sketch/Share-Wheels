const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

locationSchema.index({ isActive: 1, sortOrder: 1, name: 1 });

module.exports = mongoose.model("Location", locationSchema);
