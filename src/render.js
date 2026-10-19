// Dessin de l'écran LCD (64 × 40 pixels logiques).
import { ITEMS } from './sprites.js';

export const S = 5, W = 64, H = 40, GROUND = 35;
export const LCD = { bg: '#b9c99b', ink: '#26331b', night: '#3a4a2c' };

function painter(ctx, scale) {
  const px = (x, y) => ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1);
  const rows = (r, x, y) => r.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') px(x + i, y + j); });
  const pts = (list, x, y) => list.forEach(([a, b]) => px(x + a, y + b));
  return { px, rows, pts };
}

// Fond avec la grille de pixels éteints, comme un vrai écran LCD
function ghostLayer(w, h, scale, bg, ink) {
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = ink; g.globalAlpha = 0.07;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) g.fillRect(x * scale, y * scale, scale - 1, scale - 1);
  return c;
}

export function drawFace(px, face, ox, oy, o = {}) {
  const look = o.look || 0;
  for (const [ex, ey] of face.eyes) {
    const x = ox + ex + look, y = oy + ey;
    if (o.sleeping || o.blink) { px(x - 1, y + 1); px(x, y + 1); px(x + 1, y + 1); }
    else if (o.mood === 'happy') { px(x - 1, y + 1); px(x, y); px(x + 1, y + 1); }
    else if (o.mood === 'sad') { px(x, y + 1); px(x, y + 2); }
    else { px(x, y); px(x, y + 1); }
  }
  const mx = ox + face.mouth[0] + look, my = oy + face.mouth[1];
  const open = o.eating && o.frame % 4 < 2;

  if (face.type === 'beak') {
    px(mx - 1, my); px(mx, my); px(mx + 1, my); px(mx + 2, my);
    const low = open ? my + 2 : my + 1;
    px(mx, low); px(mx + 1, low);
    return;
  }
  if (face.type === 'frog') {
    for (let i = -2; i <= 3; i++) px(mx + i, my);
    if (open) { px(mx, my + 1); px(mx + 1, my + 1); }
    else if (o.mood === 'happy') { px(mx - 3, my - 1); px(mx + 4, my - 1); }
    else if (o.mood === 'sad') { px(mx - 3, my + 1); px(mx + 4, my + 1); }
    return;
  }
  if (open) { px(mx, my); px(mx + 1, my); px(mx, my + 1); px(mx + 1, my + 1); }
  else if (o.sleeping) px(mx, my);
  else if (o.mood === 'happy') { px(mx - 1, my); px(mx, my + 1); px(mx + 1, my + 1); px(mx + 2, my); }
  else if (o.mood === 'sad') { px(mx - 1, my + 1); px(mx, my); px(mx + 1, my); px(mx + 2, my + 1); }
  else { px(mx, my); px(mx + 1, my); }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const { px, rows, pts } = painter(ctx, S);
  const day = ghostLayer(W, H, S, LCD.bg, LCD.ink);
  const night = ghostLayer(W, H, S, LCD.night, LCD.bg);

  // Renvoie les zones touchables (cacas, animal)
  function draw({ pet: p, stage, sprite, sc, now, frame }) {
    ctx.drawImage(p.sleeping ? night : day, 0, 0);
    ctx.fillStyle = p.sleeping ? LCD.bg : LCD.ink;
    for (let x = 1; x < W; x += 3) px(x, GROUND + 1);
    const hits = { poops: [], pet: null };

    if (stage === 'dead') {
      rows(ITEMS.grave, 27, GROUND - 7);
      if (frame % 12 < 8) px(31, 4 + (frame % 6));
      return hits;
    }

    if (stage === 'egg') {
      const wob = frame % 10 < 2 ? 1 : 0;
      const x = 32 - Math.floor(sprite.w / 2) + wob, y = GROUND - sprite.h + 1;
      pts(sprite.pts, x, y);
      if (frame % 8 < 5) { px(x - 4, y + 3); px(x - 3, y + 2); px(x + sprite.w + 3, y + 3); px(x + sprite.w + 2, y + 2); }
      hits.pet = { x: x - 6, y: y - 4, w: sprite.w + 12, h: sprite.h + 6 };
      return hits;
    }

    const { w, h } = sprite;
    let dy = !p.sleeping && frame % 8 < 4 ? -1 : 0;
    if (sprite.float) dy = -2 + Math.round(Math.sin(now / 400) * 1.5);
    if (sc.anim?.type === 'jump') dy = -Math.round(Math.abs(Math.sin((now - sc.anim.t0) / 160)) * 5);
    const ox = Math.round(sc.pos - w / 2), oy = GROUND - h + 1 + dy;
    pts(sprite.pts, ox, oy);
    hits.pet = { x: ox - 2, y: oy - 2, w: w + 4, h: h + 4 };

    const happy = (p.happy > 65 && p.hunger > 40) || sc.anim?.type === 'jump' || now < sc.cuddleUntil;
    const mood = p.sick || p.health < 30 || p.happy < 25 ? 'sad' : happy ? 'happy' : 'normal';
    drawFace(px, sprite.face, ox, oy, {
      mood, frame, sleeping: p.sleeping, look: sc.game?.look || 0,
      blink: frame % 46 < 2, eating: sc.anim?.type === 'eat',
    });

    if (sc.anim?.type === 'eat') {
      const food = ITEMS[sc.anim.food], t = Math.min(1, (now - sc.anim.t0) / sc.anim.dur);
      const bites = Math.floor(t * food[0].length);
      rows(food.map(r => '.'.repeat(bites) + r.slice(bites)), ox + w + 2, GROUND - food.length + 1);
    }
    if (sc.anim?.type === 'wash') {
      const x = Math.floor(((now - sc.anim.t0) / sc.anim.dur) * W);
      for (let y = 2; y <= GROUND; y++) px(x + (y % 2), y);
      for (let i = 0; i < 6; i++) px(x - 4 - (i * 3) % 8, GROUND - 2 - ((i * 7 + frame) % 14));
    }
    if (sc.anim?.type === 'heal' && frame % 4 < 2) {
      const cx = ox + w + 3, cy = oy + 2;
      px(cx, cy); px(cx - 1, cy + 1); px(cx, cy + 1); px(cx + 1, cy + 1); px(cx, cy + 2);
    }
    if (sc.game?.phase === 'ask' && frame % 6 < 4) {
      px(4, 18); px(5, 17); px(5, 19); px(59, 18); px(58, 17); px(58, 19);
    }

    for (let i = 0; i < p.poops; i++) {
      const x = 58 - i * 6;
      rows(ITEMS.poop, x - 2, GROUND - 2);
      if ((frame + i) % 6 < 3) px(x - 1, GROUND - 5); else px(x + 1, GROUND - 6);
      hits.poops.push({ x: x - 4, y: GROUND - 8, w: 8, h: 10 });
    }
    for (const hd of sc.hearts) {
      const t = now - hd.t0;
      rows(ITEMS.heart, Math.round(hd.x) - 2, Math.round(hd.y - 5 - t / 120));
    }
    if (p.sick && !p.sleeping) rows(ITEMS.skull, 2, 2);
    if (p.sleeping) {
      const up = frame % 12 < 6 ? 0 : 1;
      for (const [x, y] of [[55, 3], [56, 3], [57, 3], [56, 4], [55, 5], [55, 6], [56, 6], [57, 6]]) px(x, y - up);
    }
    return hits;
  }

  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  return { draw, toLogical };
}

export function drawPreview(canvas, sprite) {
  const sc = 4, w = canvas.width / sc, h = canvas.height / sc;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(ghostLayer(w, h, sc, LCD.bg, LCD.ink), 0, 0);
  ctx.fillStyle = LCD.ink;
  const { px, pts } = painter(ctx, sc);
  const ox = Math.round((w - sprite.w) / 2), oy = h - sprite.h - 2;
  pts(sprite.pts, ox, oy);
  drawFace(px, sprite.face, ox, oy, { mood: 'happy' });
  for (let x = 1; x < w; x += 3) px(x, h - 1);
}
