// Generates the PWA icon set as crisp SVG-drawn glyphs (no raster compositing),
// so the artwork fills the frame and stays sharp at every size.
//
// Two variants:
//   - "mark"     : an open book on a full-bleed midnight-indigo background. Used for
//                  the home-screen / maskable / apple-touch icons and the favicon.
//   - "wordmark" : the same book above the word "BookTalk", laid out inside the
//                  centre safe zone so it survives a circular crop. Used for the
//                  larger "any" icons the browser shows in the install prompt.
//
// Run with:  pnpm icons:generate   (needs the `sharp` devDependency)
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const pub = path.resolve(dir, "../public");

// Brand palette
const BG_TOP = "#3a1f7a"; // lighter indigo (top of gradient)
const BG_BOTTOM = "#18093f"; // midnight (bottom of gradient)
const PAGE = "#fbf6e9"; // ivory pages
const OUTLINE = "#160a33"; // near-black indigo outline
const LINES = "#8b6fe0"; // lavender text lines
const INK = "#fbf6e9"; // wordmark text (ivory)

// The open book, drawn in a 100×100 coordinate box (centred ~50,52).
function bookGlyph() {
  return `
    <g stroke="${OUTLINE}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M50 33 C39 26 23 25 13 30 L11 66 C23 61 39 62 50 69 Z" fill="${PAGE}"/>
      <path d="M50 33 C61 26 77 25 87 30 L89 66 C77 61 61 62 50 69 Z" fill="${PAGE}"/>
      <path d="M50 33 L50 69"/>
    </g>
    <g stroke="${LINES}" stroke-width="2.6" stroke-linecap="round" fill="none">
      <path d="M20 39 C28 37 39 38 45 41"/>
      <path d="M19 47 C27 45 39 46 45 49"/>
      <path d="M19 55 C27 53 39 54 45 57"/>
      <path d="M55 41 C61 38 72 37 80 39"/>
      <path d="M55 49 C61 46 73 45 81 47"/>
      <path d="M55 57 C61 54 73 53 81 55"/>
    </g>`;
}

function background(size) {
  return `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${BG_TOP}"/>
        <stop offset="1" stop-color="${BG_BOTTOM}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bg)"/>`;
}

// Place the 100×100 book, scaled to `scale` of the icon, centred (dy nudges vertically).
function placedBook(size, scale, dy = 0) {
  const box = size * scale;
  const tx = (size - box) / 2;
  const ty = (size - box) / 2 + dy;
  return `<g transform="translate(${tx} ${ty}) scale(${box / 100})">${bookGlyph()}</g>`;
}

async function writeSvg(svg, out) {
  await sharp(Buffer.from(svg)).png().toFile(path.join(pub, out));
  console.log("wrote", out);
}

// Book-only icon on the midnight background.
function markSvg(size, scale) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${background(size)}
    ${placedBook(size, scale)}
  </svg>`;
}

// Book + "BookTalk", both kept inside the centre so a circle crop won't clip them.
function wordmarkSvg(size) {
  const fontSize = Math.round(size * 0.115);
  const textY = Math.round(size * 0.75);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    ${background(size)}
    ${placedBook(size, 0.46, -size * 0.11)}
    <text x="50%" y="${textY}" text-anchor="middle"
      font-family="Georgia, 'Times New Roman', serif" font-weight="700"
      font-size="${fontSize}" fill="${INK}">BookTalk</text>
  </svg>`;
}

// Home-screen / small "any" icons — book only.
await writeSvg(markSvg(64, 0.82), "pwa-64x64.png");
await writeSvg(markSvg(180, 0.82), "apple-touch-icon-180x180.png");
await writeSvg(markSvg(256, 0.82), "favicon.png");
// Maskable — book kept inside the ~80% safe zone Android circle-crops to.
await writeSvg(markSvg(512, 0.72), "maskable-icon-512x512.png");
await writeSvg(markSvg(192, 0.72), "maskable-icon-192x192.png");
// Larger "any" icons the install prompt shows — book + wordmark.
await writeSvg(wordmarkSvg(192), "pwa-192x192.png");
await writeSvg(wordmarkSvg(512), "pwa-512x512.png");

console.log("done");
