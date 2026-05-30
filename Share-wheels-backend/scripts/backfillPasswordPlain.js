/**
 * Fills passwordPlain for users created before admin password display was added.
 * Sets the same default password + bcrypt hash for each missing user.
 *
 * Usage: node scripts/backfillPasswordPlain.js
 * Optional: BACKFILL_USER_PASSWORD=yourpass node scripts/backfillPasswordPlain.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const { connectMongo, disconnectMongo, mongoUriHint } = require("./mongoConnect");
const User = require("../src/models/userModel");

const run = async () => {
  const plain = String(process.env.BACKFILL_USER_PASSWORD || "password123").trim();
  if (plain.length < 6) {
    console.error("BACKFILL_USER_PASSWORD must be at least 6 characters");
    process.exit(1);
  }

  console.log("Connecting to:", mongoUriHint());
  await connectMongo();

  const missing = await User.find({
    $or: [
      { passwordPlain: { $exists: false } },
      { passwordPlain: null },
      { passwordPlain: "" },
    ],
  }).select("+password");

  const hash = await bcrypt.hash(plain, 10);
  let updated = 0;

  for (const user of missing) {
    user.passwordPlain = plain;
    user.password = hash;
    await user.save();
    updated += 1;
    console.log(`  updated: ${user.email}`);
  }

  console.log(`\nDone. Updated ${updated} user(s) with password: ${plain}`);
  await disconnectMongo();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
