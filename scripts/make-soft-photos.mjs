// Makes the lighter, softer graded photo variants used on the two Google pages.
// The Meta pages keep the ungraded "-v2" files. Sources are the shoot stills
// (2160x3840) in the folder passed as the first argument.
//
//   node scripts/make-soft-photos.mjs "C:/path/to/Images"
//
// Output goes to handover/assets/img/ as <stem>-soft-640.jpg and -1280.jpg.
// `npm run build` then recompresses them and adds the WebP set.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'handover', 'assets', 'img');
const dir = process.argv[2];
if (!dir) {
  console.error('usage: node scripts/make-soft-photos.mjs <folder with the 1007(n).jpg stills>');
  process.exit(2);
}

// same crops as the "-v2" files
const JOBS = [
  { file: '1007(16).jpg', stem: 'clinic-consultation-soft', crop: { left: 0, top: 500, width: 2160, height: 2700 }, sizes: [[1280, 1600], [640, 800]] },
  { file: '1007(13).jpg', stem: 'clinic-room-soft', crop: { left: 0, top: 900, width: 2160, height: 1440 }, sizes: [[1280, 853], [640, 427]] },
  { file: '1007(6).jpg', stem: 'clinic-laser-treatment-soft', crop: { left: 0, top: 300, width: 2160, height: 2700 }, sizes: [[1280, 1600], [640, 800]] },
  { file: '1007(8).jpg', stem: 'co2-handpiece-soft', crop: { left: 0, top: 800, width: 2160, height: 1440 }, sizes: [[1280, 853], [640, 427]] },
];

for (const { file, stem, crop, sizes } of JOBS) {
  for (const [w, h] of sizes) {
    await sharp(path.join(dir, file))
      .extract(crop)
      .resize(w, h)
      .modulate({ brightness: 1.07, saturation: 0.9 }) // lighter, slightly muted
      .linear(0.92, 14)                                  // lower contrast, lifted blacks
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(OUT, `${stem}-${w}.jpg`));
  }
  console.log(`${stem} done`);
}
