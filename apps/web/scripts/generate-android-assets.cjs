const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const rootDir = path.resolve(__dirname, "..");
const favIcon = path.join(rootDir, "public/brand/fav-icon.png");
const logo = path.join(rootDir, "public/brand/logo.png");
const androidResDir = path.join(rootDir, "android/app/src/main/res");

const densities = [
  { name: "mipmap-mdpi", size: 48 },
  { name: "mipmap-hdpi", size: 72 },
  { name: "mipmap-xhdpi", size: 96 },
  { name: "mipmap-xxhdpi", size: 144 },
  { name: "mipmap-xxxhdpi", size: 192 },
];

const splashDensities = [
  { name: "drawable", w: 480, h: 800 },
  { name: "drawable-land", w: 800, h: 480 },
  { name: "drawable-hdpi", w: 720, h: 1280 },
  { name: "drawable-land-hdpi", w: 1280, h: 720 },
  { name: "drawable-xhdpi", w: 1080, h: 1920 },
  { name: "drawable-land-xhdpi", w: 1920, h: 1080 },
  { name: "drawable-xxhdpi", w: 1440, h: 2560 },
  { name: "drawable-land-xxhdpi", w: 2560, h: 1440 },
  { name: "drawable-xxxhdpi", w: 2160, h: 3840 },
  { name: "drawable-land-xxxhdpi", w: 3840, h: 2160 },
];

async function run() {
  for (const d of densities) {
    const dir = path.join(androidResDir, d.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await sharp(favIcon)
      .resize(d.size, d.size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(path.join(dir, "ic_launcher.png"));

    await sharp(favIcon)
      .resize(d.size, d.size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(path.join(dir, "ic_launcher_round.png"));

    const fgSize = Math.round((d.size * 108) / 48);
    const innerSize = Math.round(fgSize * 0.6);
    const innerPad = Math.round((fgSize - innerSize) / 2);
    const innerBuf = await sharp(favIcon)
      .resize(innerSize, innerSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: innerBuf, top: innerPad, left: innerPad }])
      .png()
      .toFile(path.join(dir, "ic_launcher_foreground.png"));

    console.log(`${d.name} icons done`);
  }

  for (const s of splashDensities) {
    const dir = path.join(androidResDir, s.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const logoMaxW = Math.round(s.w * 0.5);
    const logoMaxH = Math.round(s.h * 0.12);
    const logoBuf = await sharp(logo)
      .resize(logoMaxW, logoMaxH, {
        fit: "inside",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    const lm = await sharp(logoBuf).metadata();
    const lw = lm.width || logoMaxW;
    const lh = lm.height || logoMaxH;

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        {
          input: logoBuf,
          top: Math.round((s.h - lh) / 2),
          left: Math.round((s.w - lw) / 2),
        },
      ])
      .png()
      .toFile(path.join(dir, "splash.png"));

    console.log(`${s.name} splash done`);
  }

  console.log("All Android assets generated!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
