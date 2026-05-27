/**
 * Generates Android launcher icons from src/assets/icon.png on splash gradient.
 * Usage: node scripts/generate-android-icons.js
 */
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const SOURCE = path.join(ROOT, "src", "assets", "icon.png");
const RES = path.join(ROOT, "android", "app", "src", "main", "res");

/** Matches SplashScreen LinearGradient */
const GRADIENT_STOPS = [
  { offset: "0%", color: "#0F172A" },
  { offset: "35%", color: "#1D4ED8" },
  { offset: "72%", color: "#2563EB" },
  { offset: "100%", color: "#38BDF8" },
];

const SIZES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const FOREGROUND_SIZES = {
  "drawable-mdpi": 108,
  "drawable-hdpi": 162,
  "drawable-xhdpi": 216,
  "drawable-xxhdpi": 324,
  "drawable-xxxhdpi": 432,
};

const gradientSvg = (size) => {
  const stops = GRADIENT_STOPS.map(
    (s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`
  ).join("");
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="10%" y1="0%" x2="90%" y2="100%">
      ${stops}
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
</svg>`;
};

/**
 * Build RGBA logo from app icon.png — white mark, transparent elsewhere
 * so the gradient shows through (no black lines/background).
 */
const buildLogoFromAsset = async (logoSize) => {
  const workSize = Math.max(logoSize * 4, 512);

  const { data, info } = await sharp(SOURCE)
    .resize(workSize, workSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const rgba = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i += 1) {
    const o = i * channels;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const out = i * 4;
    if (lum > 95) {
      rgba[out] = 255;
      rgba[out + 1] = 255;
      rgba[out + 2] = 255;
      rgba[out + 3] = Math.min(255, Math.round((lum - 95) * 4.5));
    } else {
      rgba[out] = 0;
      rgba[out + 1] = 0;
      rgba[out + 2] = 0;
      rgba[out + 3] = 0;
    }
  }

  return sharp(rgba, { raw: { width, height, channels: 4 } })
    .resize(logoSize, logoSize, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
};

const buildLauncherIcon = async (size) => {
  const logoSize = Math.round(size * 0.58);
  const [background, logo] = await Promise.all([
    sharp(Buffer.from(gradientSvg(size))).png().toBuffer(),
    buildLogoFromAsset(logoSize),
  ]);

  return sharp(background)
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
};

const buildForegroundLayer = async (size) => {
  const logoSize = Math.round(size * 0.54);
  const logo = await buildLogoFromAsset(logoSize);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
};

const run = async () => {
  if (!fs.existsSync(SOURCE)) {
    console.error("Missing app logo:", SOURCE);
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    const fg = await buildForegroundLayer(size);
    await sharp(fg).toFile(path.join(dir, "ic_launcher_foreground.png"));
    console.log(`Wrote ${folder}/ic_launcher_foreground.png`);
  }

  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    const icon = await buildLauncherIcon(size);
    await sharp(icon).toFile(path.join(dir, "ic_launcher.png"));
    await sharp(icon).toFile(path.join(dir, "ic_launcher_round.png"));
    console.log(`Wrote ${folder} (${size}px)`);
  }

  const preview = await buildLauncherIcon(512);
  await sharp(preview).toFile(path.join(ROOT, "src", "assets", "app-icon.png"));
  console.log("Done: app logo (icon.png) on splash gradient blue background.");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
