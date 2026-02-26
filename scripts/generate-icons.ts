#!/usr/bin/env tsx
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FRONTEND_PUBLIC = join(ROOT, "frontend", "public");
const MOBILE_ASSETS = join(ROOT, "mobile", "assets");

const isDev = process.argv.includes("--dev");

const BANNER_COLOR = "#FF3B30";
const BANNER_TEXT_COLOR = "#FFFFFF";

/**
 * Adjusts the SVG viewBox to control how much padding surrounds the content.
 * A positive inset zooms in (less padding), negative zooms out (more padding).
 */
function adjustViewBox(svg: string, inset: number): string {
  return svg.replace(
    /viewBox="0 0 1024 1024"/,
    `viewBox="${inset} ${inset} ${1024 - inset * 2} ${1024 - inset * 2}"`,
  );
}

function setViewBox(svg: string, width: number, height: number): Buffer {
  const updated = svg.replace(
    /viewBox="[^"]*/,
    `viewBox="0 0 1024 1024" width="${width}" height="${height}`,
  );
  return Buffer.from(updated);
}

function renderSvg(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

function createIco(pngBuffers: Buffer[]): Buffer {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let dataOffset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dirEntries: Buffer[] = [];
  const sizes = [16, 32, 48];

  for (let i = 0; i < count; i++) {
    const entry = Buffer.alloc(dirEntrySize);
    const size = sizes[i];
    entry.writeUInt8(size < 256 ? size : 0, 0);
    entry.writeUInt8(size < 256 ? size : 0, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(pngBuffers[i].length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dataOffset += pngBuffers[i].length;
    dirEntries.push(entry);
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

// ---------------------------------------------------------------------------
// Web icons
// ---------------------------------------------------------------------------

async function generateWebIcons(iconSvg: string, iconBuffer: Buffer) {
  await mkdir(FRONTEND_PUBLIC, { recursive: true });

  const ico16 = await sharp(iconBuffer).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(iconBuffer).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(iconBuffer).resize(48, 48).png().toBuffer();
  await writeFile(join(FRONTEND_PUBLIC, "favicon.ico"), createIco([ico16, ico32, ico48]));
  console.log("  favicon.ico (16, 32, 48)");

  await sharp(iconBuffer).resize(180, 180).png().toFile(join(FRONTEND_PUBLIC, "apple-touch-icon.png"));
  console.log("  apple-touch-icon.png (180x180)");

  await writeFile(join(FRONTEND_PUBLIC, "icon-192x192.svg"), setViewBox(iconSvg, 192, 192));
  console.log("  icon-192x192.svg");

  await writeFile(join(FRONTEND_PUBLIC, "icon-512x512.svg"), setViewBox(iconSvg, 512, 512));
  console.log("  icon-512x512.svg");
}

// ---------------------------------------------------------------------------
// Mobile icons
// ---------------------------------------------------------------------------

async function generateMobileIcons(
  iconSvg: string,
  foregroundSvg: string,
) {
  await mkdir(MOBILE_ASSETS, { recursive: true });

  // icon.png -- full icon, rx removed for full-bleed, envelope scaled down for padding
  const scale = 0.8;
  const offset = (1024 * (1 - scale)) / 2;
  const fullBleedSvg = iconSvg
    .replace(/rx="228"/, "")
    .replace(
      '<g fill="white">',
      `<g fill="white" transform="translate(${offset},${offset}) scale(${scale})">`,
    );
  const iconBuf = await renderSvg(fullBleedSvg, 1024);
  await sharp(iconBuf).toFile(join(MOBILE_ASSETS, "icon.png"));
  console.log("  icon.png (1024x1024)");

  // adaptive-icon.png -- envelope scaled down for more padding within Android's safe zone
  const adaptiveScale = 0.85;
  const adaptiveOffset = (1024 * (1 - adaptiveScale)) / 2;
  const scaledForeground = foregroundSvg.replace(
    '<g fill="white">',
    `<g fill="white" transform="translate(${adaptiveOffset},${adaptiveOffset}) scale(${adaptiveScale})">`,
  );
  const adaptiveBuf = await renderSvg(scaledForeground, 1024);
  await sharp(adaptiveBuf).toFile(join(MOBILE_ASSETS, "adaptive-icon.png"));
  console.log("  adaptive-icon.png (1024x1024)");

  // notification-icon.png -- zoomed in to fill the small icon space
  const notifSvg = adjustViewBox(foregroundSvg, 150);
  const notifBuf = await renderSvg(notifSvg, 96);
  await sharp(notifBuf).toFile(join(MOBILE_ASSETS, "notification-icon.png"));
  console.log("  notification-icon.png (96x96)");

  // splash-icon.png -- white envelope on transparent
  const splashBuf = await renderSvg(foregroundSvg, 512);
  await sharp(splashBuf).toFile(join(MOBILE_ASSETS, "splash-icon.png"));
  console.log("  splash-icon.png (512x512)");

  // favicon.png -- full icon with rounded corners kept
  const faviconBuf = await renderSvg(iconSvg, 48);
  await sharp(faviconBuf).toFile(join(MOBILE_ASSETS, "favicon.png"));
  console.log("  favicon.png (48x48)");
}

// ---------------------------------------------------------------------------
// Dev icon variants (mobile only)
// ---------------------------------------------------------------------------

interface DevIconConfig {
  source: string;
  output: string;
  isAdaptive: boolean;
}

const DEV_ICONS: DevIconConfig[] = [
  { source: "icon.png", output: "icon-dev.png", isAdaptive: false },
  { source: "adaptive-icon.png", output: "adaptive-icon-dev.png", isAdaptive: true },
  { source: "notification-icon.png", output: "notification-icon-dev.png", isAdaptive: false },
];

async function addDevBanner(config: DevIconConfig): Promise<void> {
  const inputPath = join(MOBILE_ASSETS, config.source);
  const outputPath = join(MOBILE_ASSETS, config.output);

  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  if (!width || !height) {
    throw new Error(`Cannot read dimensions of ${config.source}`);
  }

  const safeInset = config.isAdaptive ? height * 0.17 : 0;
  const safeBottom = height - safeInset;

  const bannerHeight = Math.round(height * 0.16);
  const fontSize = Math.round(bannerHeight * 0.55);
  const cornerRadius = Math.round(width * 0.03);

  const bannerY = safeBottom - bannerHeight - height * 0.02;
  const bannerX = config.isAdaptive ? safeInset + width * 0.02 : width * 0.02;
  const bannerW = config.isAdaptive
    ? width - safeInset * 2 - width * 0.04
    : width * 0.96;

  const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-2%" y="-2%" width="104%" height="104%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
        </filter>
      </defs>
      <rect
        x="${bannerX}"
        y="${bannerY}"
        width="${bannerW}"
        height="${bannerHeight}"
        rx="${cornerRadius}"
        ry="${cornerRadius}"
        fill="${BANNER_COLOR}"
        filter="url(#shadow)"
      />
      <text
        x="${width / 2}"
        y="${bannerY + bannerHeight / 2 + fontSize * 0.1}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${BANNER_TEXT_COLOR}"
        text-anchor="middle"
        dominant-baseline="central"
        letter-spacing="${fontSize * 0.15}"
      >DEV</text>
    </svg>
  `;

  await image
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .toFile(outputPath);

  console.log(`  ${config.output} (${width}x${height})`);
}

function cleanDevIcons(): void {
  for (const icon of DEV_ICONS) {
    const devPath = join(MOBILE_ASSETS, icon.output);
    if (existsSync(devPath)) {
      unlinkSync(devPath);
      console.log(`  Removed ${icon.output}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const iconSvg = await readFile(join(__dirname, "icon.svg"), "utf-8");
  const foregroundSvg = await readFile(join(__dirname, "icon-adaptive-foreground.svg"), "utf-8");
  const iconBuffer = Buffer.from(iconSvg);

  console.log("Generating web icons...\n");
  await generateWebIcons(iconSvg, iconBuffer);

  console.log("\nGenerating mobile icons...\n");
  await generateMobileIcons(iconSvg, foregroundSvg);

  if (isDev) {
    console.log("\nGenerating mobile dev icons (--dev)...\n");
    for (const icon of DEV_ICONS) {
      await addDevBanner(icon);
    }
  } else {
    console.log("\nCleaning mobile dev icons...\n");
    cleanDevIcons();
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
