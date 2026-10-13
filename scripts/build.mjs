// Builds site/ (the Netlify publish root) from handover/ (Skalr's untouched drop).
//
//   npm run build
//
// What it does, and nothing more:
//   1. Copies handover/ to site/, minus READ-ME-FIRST.md.
//   2. Recompresses each JPEG in place: same filename, same pixel size, metadata
//      stripped. Kept only if smaller than the original.
//   3. Writes WebP versions at 640, 960 and 1280 wide next to each JPEG pair.
//   4. Wraps each content photo in <picture> with a WebP <source>. The <img> is
//      left byte for byte as Skalr generated it, so the JPEG fallback, srcset,
//      sizes, width/height, loading and fetchpriority are all unchanged.
//   5. Minifies the SVG logos (kept only if smaller) and losslessly recompresses
//      the PNG logo.
//
// The consent scripts, analytics slot, noindex tags, GHL embeds and copy are
// never touched. scripts/verify.mjs proves it.
//
// Settings are recorded here so a new Skalr drop rebuilds identically.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { optimize as svgo } from 'svgo';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'handover');
const OUT = path.join(ROOT, 'site');
const IMG = 'assets/img';

const JPEG = { mozjpeg: true, quality: 78, progressive: true };
const WEBP = { quality: 75, effort: 6, smartSubsample: true };
const WEBP_WIDTHS = [640, 960, 1280];
// Per-file WebP ceilings in bytes. These photos carry a lot of fine detail
// (patterned clothing, skin texture), so the budgets are set from measured
// output at the quality above, with headroom. Over budget fails the build.
const BUDGET = { 640: 100_000, 960: 160_000, 1280: 240_000 };

// Expected <picture> wraps per page. A mismatch means Skalr's markup changed
// shape and the transform needs a look, so the build stops rather than guess.
const EXPECTED_WRAPS = {
  'facial-rebalancing-google.html': 1,
  'facial-rebalancing-meta.html': 1,
  'co2-laser-google.html': 1,
  'co2-laser-meta.html': 1,
  'thank-you.html': 0,
  'privacy-policy/index.html': 0,
};

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const rows = [];
let failed = false;

// 1. clean copy ---------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SRC, OUT, {
  recursive: true,
  filter: (p) => path.basename(p) !== 'READ-ME-FIRST.md',
});

// 2 + 3. photographs -----------------------------------------------------------
const imgDir = path.join(OUT, IMG);
const jpegs = fs.readdirSync(imgDir).filter((f) => f.endsWith('.jpg'));
const stems = new Set();

for (const file of jpegs) {
  const p = path.join(imgDir, file);
  const orig = fs.readFileSync(p);
  const meta = await sharp(orig).metadata();
  const out = await sharp(orig).jpeg(JPEG).toBuffer();
  const outMeta = await sharp(out).metadata();
  if (outMeta.width !== meta.width || outMeta.height !== meta.height) {
    throw new Error(`${file}: recompression changed dimensions`);
  }
  const keep = out.length < orig.length;
  if (keep) fs.writeFileSync(p, out);
  rows.push([file, orig.length, keep ? out.length : orig.length]);
  stems.add(file.replace(/-(640|1280)\.jpg$/, ''));
}

for (const stem of stems) {
  // Always derive from the 1280 original in handover/, never from a recompressed
  // copy, so quality loss does not stack.
  const master = fs.readFileSync(path.join(SRC, IMG, `${stem}-1280.jpg`));
  for (const w of WEBP_WIDTHS) {
    const name = `${stem}-${w}.webp`;
    const pipeline = sharp(master);
    if (w !== 1280) pipeline.resize({ width: w });
    const buf = await pipeline.webp(WEBP).toBuffer();
    fs.writeFileSync(path.join(imgDir, name), buf);
    rows.push([name, null, buf.length]);
    if (buf.length > BUDGET[w]) {
      console.error(`OVER BUDGET: ${name} is ${kb(buf.length)}, budget ${kb(BUDGET[w])}`);
      failed = true;
    }
  }
}

// 4. <picture> transform -------------------------------------------------------
// Matches the photo <img> exactly as build_pages.py emits it: class="photo ...",
// then alt, src, srcset, sizes, on separate lines, ending at the closing ">".
const PHOTO = /<img class="photo [^"]*"[^>]*?srcset="assets\/img\/([a-z0-9-]+)-640\.jpg 640w, assets\/img\/\1-1280\.jpg 1280w"\s+sizes="([^"]+)"[^>]*>/g;

for (const [page, expected] of Object.entries(EXPECTED_WRAPS)) {
  const p = path.join(OUT, page);
  const html = fs.readFileSync(p, 'utf8');
  let count = 0;
  const next = html.replace(PHOTO, (img, stem, sizes) => {
    count++;
    const set = WEBP_WIDTHS.map((w) => `assets/img/${stem}-${w}.webp ${w}w`).join(', ');
    return `<picture><source type="image/webp" srcset="${set}" sizes="${sizes}">${img}</picture>`;
  });
  if (count !== expected) {
    throw new Error(`${page}: expected ${expected} photo(s) to wrap, found ${count}`);
  }
  if (count) fs.writeFileSync(p, next);
}

// 5. logos ---------------------------------------------------------------------
for (const file of ['dr-chandni-logo.svg', 'dr-chandni-logo-white.svg']) {
  const p = path.join(OUT, 'assets', file);
  const orig = fs.readFileSync(p, 'utf8');
  const { data } = svgo(orig, {
    multipass: true,
    floatPrecision: 2,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // svgo 4 keeps <title> and viewBox by default. Also keep role="img"
            // and the currentColor fill.
            removeUnknownsAndDefaults: { keepRoleAttr: true },
            convertColors: { currentColor: false },
          },
        },
      },
    ],
  });
  const keep = Buffer.byteLength(data) < Buffer.byteLength(orig);
  if (keep) fs.writeFileSync(p, data);
  rows.push([file, Buffer.byteLength(orig), keep ? Buffer.byteLength(data) : Buffer.byteLength(orig)]);
}

{
  const p = path.join(OUT, 'assets', 'dr-chandni-logo.png');
  const orig = fs.readFileSync(p);
  const out = await sharp(orig).png({ compressionLevel: 9, effort: 10, palette: false }).toBuffer();
  const keep = out.length < orig.length;
  if (keep) fs.writeFileSync(p, out);
  rows.push(['dr-chandni-logo.png', orig.length, keep ? out.length : orig.length]);
}

// report -----------------------------------------------------------------------
console.log('\nfile'.padEnd(37) + 'before'.padStart(11) + 'after'.padStart(11));
for (const [name, before, after] of rows) {
  console.log(name.padEnd(36) + (before ? kb(before) : 'new').padStart(11) + kb(after).padStart(11));
}
if (failed) {
  console.error('\nBuild failed: one or more files over budget.');
  process.exit(1);
}
console.log('\nBuilt site/ from handover/.');
