// Generates the PWA icon set from the source mark (public/favicon.png).
//
// Two variants:
//   - "mark"     : the open-book-in-a-speech-bubble mark on its own. Used for the
//                  home-screen / maskable / apple-touch icons and the small favicon,
//                  since the OS already shows the app name under the icon.
//   - "wordmark" : the mark above the word "BookTalk". Used for the larger "any"
//                  icons the browser shows in the install prompt, where the icon
//                  stands alone and the extra label helps.
//
// Run with:  pnpm icons:generate   (needs the `sharp` devDependency)
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(dir, "../public");
const SRC = path.join(pub, "favicon.png");

const WHITE = "#ffffff"; // matches the source's own background, so composites are seamless
const INK = "#2a1553"; // the mark's dark-indigo outline colour, reused for the wordmark text

// The source has a fixed white margin around the mark; trim it once so we can
// control padding and the maskable safe zone ourselves.
const mark = await sharp(SRC).trim({ threshold: 10 }).png().toBuffer();

function whiteCanvas(size) {
  return sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  });
}

// The mark alone, centred on a white square at `scale` of the canvas.
async function renderMark(size, scale, out) {
  const content = Math.round(size * scale);
  const resized = await sharp(mark)
    .resize({ width: content, height: content, fit: "contain", background: WHITE })
    .toBuffer();
  const off = Math.round((size - content) / 2);
  await whiteCanvas(size)
    .composite([{ input: resized, left: off, top: off }])
    .png()
    .toFile(path.join(pub, out));
  console.log("wrote", out);
}

// The mark in the upper area with "BookTalk" beneath it.
async function renderWordmark(size, out) {
  const markBox = Math.round(size * 0.66);
  const resized = await sharp(mark)
    .resize({ width: markBox, height: markBox, fit: "contain", background: WHITE })
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const markLeft = Math.round((size - meta.width) / 2);
  const markTop = Math.round(size * 0.05);
  const fontSize = Math.round(size * 0.155);
  const textY = Math.round(size * 0.9);
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<text x="50%" y="${textY}" text-anchor="middle" ` +
      `font-family="Georgia, 'Times New Roman', serif" font-weight="700" ` +
      `font-size="${fontSize}" fill="${INK}">BookTalk</text></svg>`
  );
  await whiteCanvas(size)
    .composite([
      { input: resized, left: markLeft, top: markTop },
      { input: svg, left: 0, top: 0 },
    ])
    .png()
    .toFile(path.join(pub, out));
  console.log("wrote", out);
}

// Home-screen / small "any" icons — mark only.
await renderMark(64, 0.9, "pwa-64x64.png");
await renderMark(180, 0.86, "apple-touch-icon-180x180.png");
// Maskable — mark kept inside the ~80% safe zone Android circle-crops to.
await renderMark(512, 0.76, "maskable-icon-512x512.png");
await renderMark(192, 0.76, "maskable-icon-192x192.png");
// Larger "any" icons the install prompt shows — mark + wordmark.
await renderWordmark(192, "pwa-192x192.png");
await renderWordmark(512, "pwa-512x512.png");

console.log("done");
