import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgContent = readFileSync(join(publicDir, 'favicon.svg'));

const sizes = [
  { name: 'favicon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    await sharp(svgContent)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name));
    console.log(`Generated ${name}`);
  }

  // Generate ICO file (just use 32x32 PNG as ICO base)
  // ICO format is complex, we'll use the 32x32 PNG and rename approach
  // Modern browsers prefer SVG anyway
  const png32 = await sharp(svgContent)
    .resize(32, 32)
    .png()
    .toBuffer();

  // Create a simple ICO file (single 32x32 image)
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);  // Reserved
  icoHeader.writeUInt16LE(1, 2);  // ICO type
  icoHeader.writeUInt16LE(1, 4);  // Number of images

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0);     // Width
  dirEntry.writeUInt8(32, 1);     // Height
  dirEntry.writeUInt8(0, 2);      // Color palette
  dirEntry.writeUInt8(0, 3);      // Reserved
  dirEntry.writeUInt16LE(1, 4);   // Color planes
  dirEntry.writeUInt16LE(32, 6);  // Bits per pixel
  dirEntry.writeUInt32LE(png32.length, 8);  // Image size
  dirEntry.writeUInt32LE(22, 12); // Offset to image data (6 + 16)

  const ico = Buffer.concat([icoHeader, dirEntry, png32]);
  writeFileSync(join(publicDir, 'favicon.ico'), ico);
  console.log('Generated favicon.ico');
}

generateIcons().catch(console.error);
