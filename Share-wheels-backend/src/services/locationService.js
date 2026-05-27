const Location = require("../models/locationModel");

const normalizeName = (name) => String(name || "").trim();

const listActiveLocations = async () => {
  const locations = await Location.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select("name sortOrder")
    .lean();
  return {
    status: 200,
    body: {
      success: true,
      locations: locations.map((l) => l.name),
    },
  };
};

const listAllLocations = async () => {
  const locations = await Location.find()
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return {
    status: 200,
    body: { success: true, locations },
  };
};

const nameRegex = (name) =>
  new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const findByName = (name) =>
  Location.findOne({ name: { $regex: nameRegex(name) } });

const createLocation = async (body) => {
  const name = normalizeName(body?.name);
  if (!name) {
    return { status: 400, body: { success: false, message: "Location name is required" } };
  }
  const existing = await findByName(name);
  if (existing) {
    if (body?.isActive !== undefined) existing.isActive = !!body.isActive;
    else existing.isActive = true;
    if (body?.sortOrder !== undefined) {
      existing.sortOrder = Number(body.sortOrder) || 0;
    }
    await existing.save();
    return {
      status: 200,
      body: { success: true, location: existing, updated: true },
    };
  }
  const maxOrder = await Location.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
  const location = await Location.create({
    name,
    isActive: body?.isActive !== false,
    sortOrder:
      body?.sortOrder !== undefined
        ? Number(body.sortOrder) || 0
        : (maxOrder?.sortOrder ?? 0) + 1,
  });
  return { status: 201, body: { success: true, location, created: true } };
};

const updateLocation = async (id, body) => {
  const location = await Location.findById(id);
  if (!location) {
    return { status: 404, body: { success: false, message: "Location not found" } };
  }
  if (body?.name !== undefined) {
    const name = normalizeName(body.name);
    if (!name) {
      return { status: 400, body: { success: false, message: "Location name cannot be empty" } };
    }
    const duplicate = await Location.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (duplicate) {
      return { status: 409, body: { success: false, message: "Location already exists" } };
    }
    location.name = name;
  }
  if (body?.isActive !== undefined) location.isActive = !!body.isActive;
  if (body?.sortOrder !== undefined) location.sortOrder = Number(body.sortOrder) || 0;
  await location.save();
  return { status: 200, body: { success: true, location } };
};

const deleteLocation = async (id) => {
  const location = await Location.findByIdAndDelete(id);
  if (!location) {
    return { status: 404, body: { success: false, message: "Location not found" } };
  }
  return { status: 200, body: { success: true, message: "Location deleted" } };
};

/** Add new names; update only matching existing rows (does not delete others) */
const bulkUpsertLocations = async (names = []) => {
  const cleaned = [...new Set(names.map(normalizeName).filter(Boolean))];
  if (!cleaned.length) {
    return {
      status: 400,
      body: { success: false, message: "Provide at least one location name" },
    };
  }

  const maxOrderDoc = await Location.findOne()
    .sort({ sortOrder: -1 })
    .select("sortOrder")
    .lean();
  let nextOrder = (maxOrderDoc?.sortOrder ?? 0) + 1;

  let created = 0;
  let updated = 0;

  for (const name of cleaned) {
    const existing = await findByName(name);
    if (existing) {
      existing.name = name;
      existing.isActive = true;
      await existing.save();
      updated += 1;
    } else {
      await Location.create({ name, isActive: true, sortOrder: nextOrder });
      nextOrder += 1;
      created += 1;
    }
  }

  const locations = await Location.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .select("name")
    .lean();

  return {
    status: 200,
    body: {
      success: true,
      message: `Added ${created}, updated ${updated}. Other locations unchanged.`,
      created,
      updated,
      count: cleaned.length,
      locations: locations.map((l) => l.name),
    },
  };
};

const clearAllLocations = async () => {
  const result = await Location.deleteMany({});
  return {
    status: 200,
    body: {
      success: true,
      message: "All locations removed",
      deleted: result.deletedCount || 0,
    },
  };
};

module.exports = {
  listActiveLocations,
  listAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  bulkUpsertLocations,
  clearAllLocations,
};
