#!/usr/bin/env tsx
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FRONTEND_PUBLIC = join(ROOT, 'frontend', 'public');
const MOBILE_ASSETS = join(ROOT, 'mobile', 'assets');

function createIco(pngBuffers: Buffer[]): Buffer {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * count;
  let dataOffset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4);

  const dirEntries: Buffer[] = [];
  const sizes = [16, 32, 48];

  for (let i = 0; i < count; i++) {
    const entry = Buffer.alloc(dirEntrySize);
    const size = sizes[i];
    entry.writeUInt8(size < 256 ? size : 0, 0); // width
    entry.writeUInt8(size < 256 ? size : 0, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngBuffers[i].length, 8); // image data size
    entry.writeUInt32LE(dataOffset, 12); // offset to image data
    dataOffset += pngBuffers[i].length;
    dirEntries.push(entry);
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

function setViewBox(svg: string, width: number, height: number): Buffer {
  const updated = svg
    .replace(/viewBox="[^"]*"/, `viewBox="0 0 1024 1024" width="${width}" height="${height}"`);
  return Buffer.from(updated);
}

async function main() {
  console.log('Generating icon assets...\n');

  await mkdir(FRONTEND_PUBLIC, { recursive: true });
  await mkdir(MOBILE_ASSETS, { recursive: true });

  const iconSvg = await readFile(join(__dirname, 'icon.svg'), 'utf-8');
  const adaptiveSvg = await readFile(join(__dirname, 'icon-adaptive-foreground.svg'), 'utf-8');
  const iconBuffer = Buffer.from(iconSvg);
  const adaptiveBuffer = Buffer.from(adaptiveSvg);

  // --- Web icons (only raster formats that have no SVG alternative) ---

  // favicon.ico — legacy browser fallback (modern browsers use the SVG favicon)
  const ico16 = await sharp(iconBuffer).resize(16, 16).png().toBuffer();
  const ico32 = await sharp(iconBuffer).resize(32, 32).png().toBuffer();
  const ico48 = await sharp(iconBuffer).resize(48, 48).png().toBuffer();
  const icoBuffer = createIco([ico16, ico32, ico48]);
  await writeFile(join(FRONTEND_PUBLIC, 'favicon.ico'), icoBuffer);
  console.log('  ✓ frontend/public/favicon.ico (16, 32, 48)');

  // apple-touch-icon.png — Apple requires PNG for home-screen icons
  await sharp(iconBuffer).resize(180, 180).png().toFile(join(FRONTEND_PUBLIC, 'apple-touch-icon.png'));
  console.log('  ✓ frontend/public/apple-touch-icon.png (180x180)');

  // SVGs (with appropriate width/height hints for the PWA manifest)
  await writeFile(join(FRONTEND_PUBLIC, 'icon-192x192.svg'), setViewBox(iconSvg, 192, 192));
  console.log('  ✓ frontend/public/icon-192x192.svg');

  await writeFile(join(FRONTEND_PUBLIC, 'icon-512x512.svg'), setViewBox(iconSvg, 512, 512));
  console.log('  ✓ frontend/public/icon-512x512.svg');

  // --- Mobile icons ---

  // Main app icon (1024x1024, no transparency — fill transparent areas with the gradient start color)
  await sharp(iconBuffer)
    .resize(1024, 1024)
    .flatten({ background: { r: 102, g: 126, b: 234 } })
    .png()
    .toFile(join(MOBILE_ASSETS, 'icon.png'));
  console.log('  ✓ mobile/assets/icon.png (1024x1024)');

  // Android adaptive icon foreground (1024x1024, transparent background)
  await sharp(adaptiveBuffer).resize(1024, 1024).png().toFile(join(MOBILE_ASSETS, 'adaptive-icon.png'));
  console.log('  ✓ mobile/assets/adaptive-icon.png (1024x1024, transparent)');

  // Splash screen icon (288x288, transparent — shown on colored background)
  await sharp(adaptiveBuffer).resize(288, 288).png().toFile(join(MOBILE_ASSETS, 'splash-icon.png'));
  console.log('  ✓ mobile/assets/splash-icon.png (288x288)');

  // Expo web favicon (48x48)
  await sharp(iconBuffer)
    .resize(48, 48)
    .flatten({ background: { r: 102, g: 126, b: 234 } })
    .png()
    .toFile(join(MOBILE_ASSETS, 'favicon.png'));
  console.log('  ✓ mobile/assets/favicon.png (48x48)');

  console.log('\nDone! All icon assets generated.');
}

main().catch((err) => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
