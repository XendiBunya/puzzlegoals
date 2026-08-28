// Built-in box tops, drawn on a canvas at runtime so the app ships no image assets.
import { mulberry32 } from './rng.js';
import { BOARD_W as W, BOARD_H as H } from './jigsaw.js';

function canvasURL(draw) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  draw(c.getContext('2d'));
  return c.toDataURL('image/jpeg', 0.9);
}

const ridgeline = () => canvasURL((ctx) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1B2A4A'); g.addColorStop(0.45, '#54506E');
  g.addColorStop(0.72, '#C97B54'); g.addColorStop(1, '#EFB071');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#F6D9A8'; ctx.beginPath(); ctx.arc(W * 0.68, H * 0.52, 54, 0, 7); ctx.fill();
  const r = mulberry32(7);
  ['#3E4668', '#33395A', '#272C4A', '#1B1F38', '#12162A'].forEach((col, i) => {
    const base = H * (0.52 + i * 0.105), amp = 48 - i * 6;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 9) {
      ctx.lineTo(x, base + Math.sin(x / (150 + i * 40) + i * 2.1) * amp
        + Math.sin(x / 47 + i) * amp * 0.28 + (r() - 0.5) * 3);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  });
});

const tide = () => canvasURL((ctx) => {
  const cols = ['#0B3B44', '#12555C', '#1E7A79', '#3FA294', '#7CC4A8', '#C3DCC0', '#E8D9AE', '#D9B98A'];
  const r = mulberry32(31);
  let y = 0;
  cols.forEach((c, i) => {
    const h = (H / cols.length) * (0.72 + r() * 0.6);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y + Math.sin(x / 110 + i * 1.7) * 9);
    ctx.lineTo(W, y + h + 60); ctx.lineTo(0, y + h + 60); ctx.closePath(); ctx.fill();
    y += h;
  });
  ctx.globalAlpha = 0.07; ctx.fillStyle = '#fff';
  for (let i = 0; i < 2600; i++) ctx.fillRect(r() * W, r() * H, 1.6, 1.6);
  ctx.globalAlpha = 1;
});

const bloom = () => canvasURL((ctx) => {
  ctx.fillStyle = '#EFDFC9'; ctx.fillRect(0, 0, W, H);
  const blobs = [['#D8433C', 0.22, 0.3, 330], ['#EE9A17', 0.68, 0.24, 300],
    ['#5E3E93', 0.56, 0.76, 320], ['#127A67', 0.16, 0.8, 280],
    ['#E0778F', 0.9, 0.58, 240], ['#1F4E8C', 0.44, 0.46, 210]];
  ctx.globalCompositeOperation = 'multiply';
  blobs.forEach(([c, x, y, rad]) => {
    for (let k = 0; k < 2; k++) {
      const g = ctx.createRadialGradient(W * x, H * y, 0, W * x, H * y, rad);
      g.addColorStop(0, c); g.addColorStop(0.55, c + '88');
      g.addColorStop(1, 'rgba(239,223,201,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(W * x, H * y, rad, 0, 7); ctx.fill();
    }
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(35,24,18,.20)';
  for (let x = 13; x < W; x += 24) {
    for (let y = 13; y < H; y += 24) { ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 7); ctx.fill(); }
  }
});

const RECIPES = [
  { name: 'Ridgeline', make: ridgeline },
  { name: 'Tide', make: tide },
  { name: 'Bloom', make: bloom },
];

let cache = null;
/** Rendered once per session; canvas work is not cheap enough to repeat. */
export function builtInCovers() {
  if (!cache) cache = RECIPES.map(({ name, make }) => ({ name, url: make() }));
  return cache;
}
