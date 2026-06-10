const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function run() {
  const logoPath = path.join(__dirname, '../public/logo.png');
  const iconsDir = path.join(__dirname, '../public/icons');

  if (!fs.existsSync(logoPath)) {
    console.error(`Error: Logo not found at ${logoPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const bgColor = '#09090b';

  console.log('Generating PWA icons with dark background...');

  // 1. icon-192x192.png (Standard 192x192 icon with dark background)
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: bgColor
    }
  })
  .composite([{
    input: await sharp(logoPath)
      .resize(130, 130, { fit: 'contain', background: { r: 9, g: 9, b: 11, alpha: 0 } })
      .toBuffer(),
    gravity: 'center'
  }])
  .toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('Generated: icon-192x192.png');

  // 2. icon-512x512.png (Standard 512x512 icon with dark background)
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: bgColor
    }
  })
  .composite([{
    input: await sharp(logoPath)
      .resize(340, 340, { fit: 'contain', background: { r: 9, g: 9, b: 11, alpha: 0 } })
      .toBuffer(),
    gravity: 'center'
  }])
  .toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('Generated: icon-512x512.png');

  // 3. icon-maskable-192x192.png (Maskable 192x192 icon with dark background & extra padding)
  // Maskable icons require a safe zone of 40% radius in the center. Resizing logo to 105x105 fits well.
  await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: bgColor
    }
  })
  .composite([{
    input: await sharp(logoPath)
      .resize(105, 105, { fit: 'contain', background: { r: 9, g: 9, b: 11, alpha: 0 } })
      .toBuffer(),
    gravity: 'center'
  }])
  .toFile(path.join(iconsDir, 'icon-maskable-192x192.png'));
  console.log('Generated: icon-maskable-192x192.png');

  console.log('All icons generated successfully!');
}

run().catch(console.error);
