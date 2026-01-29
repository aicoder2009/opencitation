// Process logo: high resolution with transparency
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const inputPath = join(projectRoot, 'opencitation.png');

async function processLogo() {
  console.log('Processing high-res logo...');

  // Base image with transparency
  const image = sharp(inputPath)
    .ensureAlpha()
    .unflatten();

  // App icon - high res (512x512)
  await image.clone()
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3'
    })
    .png({ quality: 100, compressionLevel: 0 })
    .toFile(join(projectRoot, 'src/app/icon.png'));
  console.log('Created: src/app/icon.png (512x512)');

  // Apple icon - high res (512x512)
  await image.clone()
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3'
    })
    .png({ quality: 100, compressionLevel: 0 })
    .toFile(join(projectRoot, 'src/app/apple-icon.png'));
  console.log('Created: src/app/apple-icon.png (512x512)');

  // Header logo - larger for retina (256x256, displays at 24-32px)
  await image.clone()
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3'
    })
    .png({ quality: 100, compressionLevel: 0 })
    .toFile(join(projectRoot, 'public/logo.png'));
  console.log('Created: public/logo.png (256x256 for retina)');

  // Favicon - larger for high DPI (64x64)
  await image.clone()
    .resize(64, 64, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3'
    })
    .png({ quality: 100, compressionLevel: 0 })
    .toFile(join(projectRoot, 'src/app/favicon.ico'));
  console.log('Created: src/app/favicon.ico (64x64)');

  console.log('Done - high resolution with transparency!');
}

processLogo().catch(console.error);
