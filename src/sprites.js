// Sprites en pixels, générés à partir de la forme et des "parts" de chaque espèce.
// Un sprite = { pts: [[x,y]...], w, h, face: { eyes, mouth, type }, float }
import { SPECIES, speciesById } from './species.js';

const key = (x, y) => x + ',' + y;
function grid() {
  const s = new Set();
  return { s, put: (x, y) => s.add(key(Math.round(x), Math.round(y))) };
}

function line(g, x0, y0, x1, y1) {
  [x0, y0, x1, y1] = [x0, y0, x1, y1].map(Math.round);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    g.put(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Recadre les points à (0,0) et décale la face d'autant
function finish(g, face, extra = {}) {
  const pts = [...g.s].map(s => s.split(',').map(Number));
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const out = {
    pts: pts.map(([x, y]) => [x - minX, y - minY]),
    w: Math.max(...xs) - minX + 1,
    h: Math.max(...ys) - minY + 1,
    ...extra,
  };
  if (face) out.face = {
    type: face.type,
    eyes: face.eyes.map(([x, y]) => [x - minX, y - minY]),
    mouth: [face.mouth[0] - minX, face.mouth[1] - minY],
  };
  return out;
}

// ---------- Morceaux propres à chaque espèce ----------
const PARTS = {
  antennae({ g, cx, topY, big }) {
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? Math.floor(cx) - 1 : Math.ceil(cx) + 1;
      const y0 = topY(x0) - 1, len = 2 + big;
      line(g, x0, y0, x0 + s * len, y0 - len);
      g.put(x0 + s * len, y0 - len - 1);
      g.put(x0 + s * (len + 1), y0 - len - 1);
      g.put(x0 + s * (len + 1), y0 - len);
    }
  },
  spout({ g, cx, topY, big }) {
    const x = Math.floor(cx) - 2, t = topY(x), k = 2 + big;
    line(g, x, t - 1, x, t - k);
    g.put(x - 1, t - k - 1); g.put(x + 1, t - k - 1);
    g.put(x - 2, t - k); g.put(x + 2, t - k);
  },
  fluke({ g, bx, w, cy, big }) {
    const e = bx + w - 1, y = Math.round(cy) + 1, f = e + 3 + big;
    line(g, e, y, e + 2, y - 1);
    line(g, e + 2, y - 1, f, y - 3 - big);
    line(g, e + 2, y - 1, f, y + 1);
    line(g, f, y - 3 - big, f, y + 1);
  },
  pointyEars({ g, bx, w, topY, big }) {
    const e = 2 + big;
    for (const s of [-1, 1]) {
      const xo = s < 0 ? bx + 1 : bx + w - 2;
      const xi = xo - s * (e + 1);
      const apex = topY(xo) - e - 1;
      line(g, xo, topY(xo), xo, apex);
      line(g, xo, apex, xi, topY(xi));
    }
  },
  longEars({ g, cx, topY, big }) {
    const len = 3 + big * 2;
    for (const s of [-1, 1]) {
      const xa = s < 0 ? Math.floor(cx) - 1 : Math.ceil(cx) + 1;
      const xb = xa + s * 2;
      const base = Math.min(topY(xa), topY(xb));
      line(g, xa, topY(xa) - 1, xa, base - len);
      line(g, xb, topY(xb) - 1, xb, base - len);
      g.put(xa + s, base - len - 1);
    }
  },
  tail({ g, bx, w, cy, big, inside }) {
    const tx = bx + w + 1, ty = cy - 1, rx = 2 + big * 0.6, ry = 3 + big;
    const inTail = (x, y) => ((x - tx) / rx) ** 2 + ((y - ty) / ry) ** 2 <= 1;
    for (let y = Math.floor(ty - ry) - 1; y <= ty + ry + 1; y++)
      for (let x = tx - 5; x <= tx + 5; x++)
        if (inTail(x, y) && !inside(x, y) && x >= bx + w - 1 &&
            (!inTail(x - 1, y) || !inTail(x + 1, y) || !inTail(x, y - 1) || !inTail(x, y + 1))) g.put(x, y);
  },
  spikes({ g, bx, w, topY }) {
    for (let x = bx; x < bx + w; x++) {
      const t = topY(x), r = (x - bx) % 3;
      if (r === 0) { g.put(x, t - 1); g.put(x, t - 2); }
      else if (r === 1) g.put(x, t - 1);
    }
  },
  eyeBumps({ g, by, w, cx, inside, setFace }) {
    const xs = [Math.ceil(cx - w / 4), Math.floor(cx + w / 4)];
    for (const c of xs)
      for (let y = by - 3; y <= by + 1; y++)
        for (let x = c - 3; x <= c + 3; x++) {
          const d = Math.hypot(x - c, y - by);
          if (d >= 1.5 && d < 2.5 && !inside(x, y)) g.put(x, y);
        }
    setFace({ eyes: xs.map(x => [x, by - 1]) });
  },
  wings({ g, bx, w, cy, big }) {
    const y = Math.round(cy), k = 2 + big;
    for (const s of [-1, 1]) {
      const e = s < 0 ? bx : bx + w - 1;
      line(g, e, y - 1, e + s * k, y + 1);
      line(g, e + s * k, y + 1, e, y + 2 + big);
    }
  },
  crest({ g, cx, topY, big }) {
    const x = Math.floor(cx), t = topY(x);
    line(g, x, t - 1, x - 1, t - 3 - big);
    line(g, x + 1, t - 1, x + 2, t - 3 - big);
  },
  cracks({ g, bx, by, w, h, big }) {
    if (big === 2) line(g, bx + 2, by + 1, bx + 3, by + 3);
    if (big) {
      line(g, bx + w - 3, by + h - 4, bx + w - 4, by + h - 3);
    } else {
      g.put(bx + w - 3, by + h - 3);
      g.put(bx + w - 2, by + h - 2);
    }
  },
  arms({ g, bx, w, cy }) {
    const y = Math.round(cy) + 1;
    for (const s of [-1, 1]) {
      const e = s < 0 ? bx : bx + w - 1;
      g.put(e + s, y);
      g.put(e + 2 * s, y - 1);
    }
  },
};

// ---------- Animal ----------
const SIZE = { baby: [10, 8], child: [14, 11], adult: [18, 14] };
const cache = new Map();

export function petSprite(speciesId, stage) {
  const id = speciesId + ':' + stage;
  if (cache.has(id)) return cache.get(id);
  const sp = speciesById(speciesId);
  let [w, h] = SIZE[stage] || SIZE.baby;
  if (sp.shape === 'tall') { w -= 2; h += 2; }
  else if (sp.shape === 'wide') { w += 2; h -= 1; }
  const big = stage === 'adult' ? 2 : stage === 'child' ? 1 : 0;
  const bx = 10, by = 10, cx = bx + (w - 1) / 2, cy = by + (h - 1) / 2;

  const inside = (x, y) => {
    if (x < bx || x > bx + w - 1 || y < by || y > by + h - 1) return false;
    const dx = (x - cx) / (w / 2), dy = (y - cy) / (h / 2);
    if (sp.shape === 'square') return !((x === bx || x === bx + w - 1) && (y === by || y === by + h - 1));
    if (sp.shape === 'ghost') {
      return y > cy || dx * dx + dy * dy <= 1;
    }
    return dx * dx + dy * dy <= 1;
  };
  const topY = x => { for (let y = by; y < by + h; y++) if (inside(x, y)) return y; return by + h; };

  const g = grid();
  for (let y = by; y < by + h; y++)
    for (let x = bx; x < bx + w; x++)
      if (inside(x, y) && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1))) g.put(x, y);

  if (sp.shape === 'ghost') for (let x = bx; x < bx + w; x++) { if ((x - bx) % 3 === 0) g.put(x, by + h); }
  else if (!sp.noFeet) {
    const fy = by + h, l = Math.floor(cx) - 2, r = Math.ceil(cx) + 1;
    g.put(l, fy); g.put(l + 1, fy); g.put(r, fy); g.put(r + 1, fy);
  }

  const eo = Math.max(2, Math.round(w * 0.2));
  const ey = by + Math.max(2, Math.round(h * 0.32));
  const face = { type: sp.face || 'normal', eyes: [[Math.ceil(cx - eo), ey], [Math.floor(cx + eo), ey]], mouth: [Math.floor(cx), ey + 3] };
  const setFace = f => Object.assign(face, f);
  for (const p of sp.parts) PARTS[p]({ g, bx, by, w, h, cx, cy, big, inside, topY, setFace });

  const sprite = finish(g, face, { float: !!sp.float });
  cache.set(id, sprite);
  return sprite;
}

// ---------- Œuf ----------
const EGG = ['...####...', '..#....#..', '.#......#.', '.#......#.', '#........#', '#........#',
             '#........#', '#........#', '#........#', '.#......#.', '..######..'];
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const EGG_PATTERNS = [
  [[4, 3], [5, 3], [2, 6], [3, 6], [2, 7], [3, 7], [6, 7], [7, 7], [6, 8], [7, 8]],
  [...range(1, 8).map(x => [x, 5]), ...range(1, 8).map(x => [x, 7])],
  range(1, 8).map(x => [x, 6 - (x % 2)]),
  [[3, 3], [6, 3], [2, 5], [5, 5], [8, 5], [3, 7], [6, 7], [4, 9]],
];
const EGG_CRACKS = [[[4, 1], [5, 2], [4, 3]], [[5, 3], [6, 4]], [[3, 4], [2, 5]]];

export function eggSprite(speciesId, taps = 0) {
  const idx = Math.max(0, SPECIES.findIndex(s => s.id === speciesId));
  const g = grid();
  EGG.forEach((row, y) => [...row].forEach((c, x) => c === '#' && g.put(x, y)));
  EGG_PATTERNS[idx % 4].forEach(([x, y]) => g.put(x, y));
  if (idx >= 4) [[4, 9], [5, 9]].forEach(([x, y]) => g.put(x, y));
  EGG_CRACKS.slice(0, taps).flat().forEach(([x, y]) => g.put(x, y));
  return finish(g);
}

// ---------- Objets ----------
export const ITEMS = {
  poop:  ['..#..', '.###.', '#####'],
  meal:  ['...#...', '..#.#..', '.#...#.', '#.###.#', '#.###.#', '#######'],
  candy: ['#.....#', '##.#.##', '#.###.#', '##.#.##', '#.....#'],
  skull: ['.###.', '#.#.#', '#####', '.#.#.'],
  heart: ['.#.#.', '#####', '.###.', '..#..'],
  grave: ['..#####..', '.#.....#.', '#..#.#..#', '#...#...#', '#..#.#..#', '#.......#', '#.......#', '#########'],
};
