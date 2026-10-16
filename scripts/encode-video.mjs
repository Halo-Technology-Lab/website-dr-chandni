// Encodes a source video into a small, lazy-load-friendly MP4 plus a WebP poster.
// The masters (about 20 Mbps) live outside the repo; only the outputs are committed.
//
//   node scripts/encode-video.mjs <source.mp4> <output-stem> [poster-seconds]
//
// Example:
//   node scripts/encode-video.mjs "C:/path/Facial Ver B.mp4" facial-intro-v3 0.8
//
// Writes handover/assets/video/<stem>.mp4 and <stem>-poster.webp. Run
// `npm run build` afterwards so site/ picks the files up.
//
// ffmpeg must be on PATH (it is at C:\FFmpeg\bin on the build machine).

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'handover', 'assets', 'video');

const [src, stem, posterAt = '0.8'] = process.argv.slice(2);
if (!src || !stem) {
  console.error('usage: node scripts/encode-video.mjs <source.mp4> <output-stem> [poster-seconds]');
  process.exit(2);
}

fs.mkdirSync(OUT, { recursive: true });
const mp4 = path.join(OUT, `${stem}.mp4`);
const posterOut = path.join(OUT, `${stem}-poster.webp`);

// 480x854 at 25 fps, constrained H.264. The clips are a person talking to camera
// and are shown at most about 400px wide, so this is plenty. Mono speech audio.
execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-i', src,
  '-vf', 'scale=480:854:flags=lanczos,fps=25',
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow',
  '-crf', '33', '-maxrate', '360k', '-bufsize', '720k', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-ac', '1', '-b:a', '48k', '-ar', '32000',
  '-movflags', '+faststart',
  mp4,
], { stdio: 'inherit' });

// Poster: one frame, given the same lighter, softer grade as the site photos.
const tmp = path.join(os.tmpdir(), `${stem}-poster.png`);
execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-ss', posterAt, '-i', src,
  '-vf', 'scale=480:854:flags=lanczos', '-frames:v', '1', tmp,
], { stdio: 'inherit' });
await sharp(tmp)
  .modulate({ brightness: 1.06, saturation: 0.92 })
  .linear(0.94, 12) // lower contrast, lift the blacks
  .webp({ quality: 72, effort: 6 })
  .toFile(posterOut);
fs.rmSync(tmp, { force: true });

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0);
console.log(`${path.basename(mp4)}  ${kb(mp4)} KB`);
console.log(`${path.basename(posterOut)}  ${kb(posterOut)} KB`);
