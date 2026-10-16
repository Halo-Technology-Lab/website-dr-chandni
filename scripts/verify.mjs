// Checks site/ against handover/ and the READ-ME-FIRST rules before a deploy.
//
//   npm run verify
//
// Exits non-zero on any failure. Run after every `npm run build`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'handover');
const OUT = path.join(ROOT, 'site');

const PAGES = [
  'facial-rebalancing-google.html',
  'facial-rebalancing-meta.html',
  'co2-laser-google.html',
  'co2-laser-meta.html',
  'thank-you.html',
  'privacy-policy/index.html',
];
const FORM_PAGES = PAGES.slice(0, 4);

let failures = 0;
let passes = 0;
const check = (ok, msg) => {
  if (ok) passes++;
  else {
    failures++;
    console.error(`FAIL  ${msg}`);
  }
};

const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const unwrap = (html) =>
  html.replace(/<picture><source type="image\/webp" srcset="[^"]*" sizes="[^"]*">(<img [^>]*>)<\/picture>/g, '$1');

for (const page of PAGES) {
  const built = read(OUT, page);
  const orig = read(SRC, page);

  // 1. nothing but the <picture> wrappers differs from Skalr's build
  check(unwrap(built) === orig, `${page}: differs from handover beyond the <picture> wrappers`);

  // 2. consent defaults run before the analytics slot, and the slot is empty
  const consentAt = built.indexOf("gtag('consent', 'default'");
  const slotAt = built.indexOf('ANALYTICS / PIXEL TAG SLOT');
  const slotEnd = built.indexOf('-->', slotAt);
  const afterSlot = built.slice(slotEnd + 3, built.indexOf('</head>'));
  check(consentAt > -1 && slotAt > -1 && consentAt < slotAt, `${page}: consent defaults must precede the analytics slot`);
  check(!/googletagmanager|gtag\/js|fbevents|connect\.facebook/.test(built), `${page}: a tracking tag is present before approval`);
  check(!/<script/.test(afterSlot), `${page}: a script has been added after the analytics slot`);

  // 3. noindex, consent banner, cookie settings link, privacy link
  check(built.includes('<meta name="robots" content="noindex, follow">'), `${page}: noindex, follow missing`);
  check(built.includes('id="dca-consent"') && built.includes("'dca-consent-v1'"), `${page}: consent banner missing`);
  check(built.includes('data-consent-reopen'), `${page}: Cookie settings link missing`);
  check(built.includes('href="/privacy-policy/"'), `${page}: privacy link missing`);

  // 4. every local asset reference resolves
  const refs = [...built.matchAll(/(?:src|href)="([^"#:]+)"|([\w./-]+\.(?:jpg|webp)) \d+w/g)]
    .map((m) => m[1] || m[2])
    .filter((r) => r && !r.startsWith('//'));
  for (const ref of refs) {
    const target = ref.startsWith('/')
      ? path.join(OUT, ref, ref.endsWith('/') ? 'index.html' : '')
      : path.join(OUT, path.dirname(page), ref);
    check(fs.existsSync(target), `${page}: missing asset ${ref}`);
  }
}

// 5. each page carries its own two-step survey embed (Skalr, 13 October 2026),
//    keeps data-cookie-consent, and loads the resizer exactly once
const SURVEY = {
  'facial-rebalancing-google.html': 'cXwzQ2RQHrIxE0TCVJ9E',
  'facial-rebalancing-meta.html': 'cXwzQ2RQHrIxE0TCVJ9E',
  'co2-laser-google.html': 'PuWcVDeTk3RnDIFO66wf',
  'co2-laser-meta.html': 'PuWcVDeTk3RnDIFO66wf',
};
const OLD_FORMS = ['Wdhw7eu5duW01zXlg7xL', 'V96BZDbxDTdyGr441EWk'];
for (const page of FORM_PAGES) {
  const built = read(OUT, page);
  const id = SURVEY[page];
  const other = Object.values(SURVEY).find((v) => v !== id);
  check(built.includes(`src="https://api.skalragency.com/widget/survey/${id}"`) && built.includes(`id="${id}"`), `${page}: survey ${id} missing or mismatched`);
  check(!built.includes(other), `${page}: carries the other treatment's survey`);
  check(!OLD_FORMS.some((o) => built.includes(o)), `${page}: still references an old single-page form`);
  check(/<iframe class="form-frame"[\s\S]*?data-cookie-consent="true"[\s\S]*?data-cookie-consent-provider="auto"/.test(built), `${page}: data-cookie-consent missing on form`);
  check((built.match(/form_embed\.js/g) || []).length === 1, `${page}: form_embed.js must appear exactly once`);
  check((built.match(/<picture>/g) || []).length === 1, `${page}: expected 1 <picture> element`);
}

// 6. thank-you.html at the root, privacy notice at /privacy-policy/
check(fs.existsSync(path.join(OUT, 'thank-you.html')), 'thank-you.html must be at the site root');
check(fs.existsSync(path.join(OUT, 'privacy-policy', 'index.html')), 'privacy-policy/index.html missing');
check(!fs.existsSync(path.join(OUT, 'READ-ME-FIRST.md')), 'READ-ME-FIRST.md must not be published');

// 7. image dimensions match the declared width/height; WebP set is complete
const imgDir = path.join(OUT, 'assets/img');
for (const file of fs.readdirSync(imgDir)) {
  const m = file.match(/-(\d+)\.(jpg|webp)$/);
  if (!m) continue;
  const meta = await sharp(path.join(imgDir, file)).metadata();
  check(meta.width === Number(m[1]), `${file}: width ${meta.width}, expected ${m[1]}`);
  check(meta.format === (m[2] === 'jpg' ? 'jpeg' : 'webp'), `${file}: wrong format ${meta.format}`);
  if (m[2] === 'jpg') {
    const orig = await sharp(path.join(SRC, 'assets/img', file)).metadata();
    check(meta.height === orig.height, `${file}: height changed from ${orig.height} to ${meta.height}`);
    check(!meta.exif && !meta.xmp, `${file}: metadata not stripped`);
  }
}

// 7b. ad-compliance wording, and the hero videos: present, muted autoplay, sound button, small
for (const page of PAGES) {
  const built = read(OUT, page);
  check(!/botox|liquid\s*face\s*lift/i.test(built), `${page}: names Botox or uses "liquid facelift" (ad compliance)`);
}
const VIDEO_BUDGET = 2 * 1024 * 1024;
const VIDEO = {
  'facial-rebalancing-google.html': 'facial-intro-v3',
  'facial-rebalancing-meta.html': 'facial-intro-v3',
  'co2-laser-google.html': 'co2-intro-v3',
  'co2-laser-meta.html': 'co2-intro-v3',
};
for (const page of FORM_PAGES) {
  const built = read(OUT, page);
  const heroAt = built.indexOf('class="hero-figure hero-video"');
  const tag = (built.match(/<video[\s\S]*?<\/video>/) || [''])[0];
  check(heroAt > -1 && heroAt < built.indexOf('id="what-h"'), `${page}: hero video missing from the hero`);
  check(/ autoplay /.test(tag) && / muted /.test(tag) && / playsinline /.test(tag), `${page}: video must be autoplay, muted and playsinline`);
  check(built.includes('class="sound-btn"') && built.includes('sound-label'), `${page}: visible sound button missing`);
  check(tag.includes(`assets/video/${VIDEO[page]}.mp4`) && tag.includes(`assets/video/${VIDEO[page]}-poster.webp`), `${page}: wrong or missing video source/poster`);
  for (const ref of [...tag.matchAll(/(?:src|poster)="(assets\/video\/[^"]+)"/g)].map((r) => r[1])) {
    const f = path.join(OUT, ref);
    check(fs.existsSync(f), `${page}: missing video asset ${ref}`);
    if (fs.existsSync(f) && ref.endsWith('.mp4')) {
      check(fs.statSync(f).size <= VIDEO_BUDGET, `${ref}: over the 2 MB video budget`);
    }
  }
}

// 8. no em or en dashes in files we author
const ours = ['netlify.toml', 'README.md', 'scripts/build.mjs', 'scripts/verify.mjs', 'scripts/encode-video.mjs', 'scripts/make-soft-photos.mjs', 'CHANGES-FOR-SKALR.md', 'package.json'];
for (const f of ours) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) check(!/[\u2013\u2014]/.test(fs.readFileSync(p, 'utf8')), `${f}: contains an em or en dash`);
}

// 9. weight report
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const total = (dir) => walk(dir).reduce((n, f) => n + fs.statSync(f).size, 0);
console.log(`handover: ${(total(SRC) / 1024).toFixed(0)} KB   site: ${(total(OUT) / 1024).toFixed(0)} KB (site includes new WebP files)`);

console.log(`${passes} checks passed, ${failures} failed.`);
process.exit(failures ? 1 : 0);
