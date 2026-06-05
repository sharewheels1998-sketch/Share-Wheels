/**
 * Encode firebase-service-account.json as base64 for Render env var.
 * Usage: node scripts/encode-firebase-env.js
 *
 * Set on Render:
 *   FIREBASE_SERVICE_ACCOUNT_BASE64=<output>
 */
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "firebase-service-account.json");
if (!fs.existsSync(file)) {
  console.error("Missing firebase-service-account.json in Share-wheels-backend/");
  process.exit(1);
}

const b64 = fs.readFileSync(file).toString("base64");
console.log("Paste into Render as FIREBASE_SERVICE_ACCOUNT_BASE64:\n");
console.log(b64);
