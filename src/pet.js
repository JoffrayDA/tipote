// Règles du jeu : état de l'animal, temps qui passe, actions.
// Aucun accès au DOM ici : ce fichier pourra tourner tel quel côté serveur
// le jour où les animaux vivront en ligne (aventures entre potes).
import { speciesById } from './species.js';

export const clamp = v => Math.max(0, Math.min(100, v));
const BASE_MODS = { hunger: 1, happy: 1, energy: 1, clean: 1, poop: 1, sick: 1, heal: 1, play: 1 };
const mods = p => ({ ...BASE_MODS, ...speciesById(p.species).mods });

export function createPet(species, name) {
  return {
    v: 1, id: crypto.randomUUID?.() || String(Date.now()),
    species, name, created: Date.now(), last: Date.now(),
    hatched: false, hatchTaps: 0, ageMin: 0,
    hunger: 70, happy: 70, clean: 100, energy: 80, health: 100,
    poops: 0, digest: 0, sick: false, sleeping: false, dead: false, lastCuddle: 0,
  };
}

export function stageOf(p) {
  if (p.dead) return 'dead';
  if (!p.hatched) return 'egg';
  return p.ageMin < 30 ? 'baby' : p.ageMin < 360 ? 'child' : 'adult';
}

// Fait vivre l'animal pendant `dm` minutes. `emit(type, info)` signale les événements.
export function simulate(p, dm, emit = () => {}) {
  if (p.dead || !p.hatched) return;
  const m = mods(p), before = stageOf(p), z = p.sleeping;
  p.ageMin += dm;
  p.hunger = clamp(p.hunger - (z ? 0.15 : 0.5) * m.hunger * dm);
  p.happy  = clamp(p.happy - ((z ? 0.08 : 0.4) * m.happy + p.poops * 0.15) * dm);
  p.energy = clamp(p.energy + (z ? 2 : -0.3 * m.energy) * dm);
  p.clean  = clamp(p.clean - (0.15 + p.poops * 0.6) * m.clean * dm);

  // digestion : un caca arrive quelques minutes après un repas
  if (!z && p.digest > 0) {
    p.digest -= dm;
    if (p.digest <= 0) { p.digest = 0; if (Math.random() < m.poop + 0.2) addPoop(p, emit); }
  }
  if (!z && Math.random() < 0.015 * m.poop * dm) addPoop(p, emit);

  if (!p.sick && (p.clean < 30 || p.hunger < 20) && Math.random() < 0.03 * m.sick * dm) { p.sick = true; emit('sick'); }

  let dh = 0;
  if (p.sick) dh -= 0.8;
  for (const k of ['hunger', 'happy', 'clean', 'energy']) if (p[k] < 15) dh -= 0.4;
  if (!p.sick && p.hunger > 50 && p.happy > 50 && p.clean > 50) dh += 0.5 * m.heal;
  p.health = clamp(p.health + dh * dm);

  if (p.health <= 0) { p.dead = true; p.sleeping = false; emit('dead'); return; }
  const after = stageOf(p);
  if (after !== before) emit('grow', after);
}

function addPoop(p, emit) { if (p.poops < 4) { p.poops++; emit('poop'); } }

// Rattrape le temps passé page fermée (24 h max)
export function catchUp(p, emit) {
  let away = Math.min((Date.now() - p.last) / 60000, 1440);
  while (away > 0 && !p.dead) { const d = Math.min(1, away); simulate(p, d, emit); away -= d; }
  p.last = Date.now();
}

function blocked(p, action) {
  if (p.dead) return `${p.name} n’est plus là…`;
  if (!p.hatched) return 'Touche l’œuf pour le faire éclore !';
  if (p.sleeping && action !== 'light') return `${p.name} dort. Rallume la lumière d’abord.`;
  return null;
}

// Renvoie { msg, anim?, game? }
export function act(p, action) {
  const why = blocked(p, action);
  if (why) return { msg: why };
  switch (action) {
    case 'meal':
      if (p.hunger > 95) return { msg: `${p.name} n’a plus faim !` };
      p.hunger = clamp(p.hunger + 30); p.digest = 3;
      return { msg: 'Miam !', anim: { type: 'eat', food: 'meal', dur: 1600 } };
    case 'candy':
      p.hunger = clamp(p.hunger + 8); p.happy = clamp(p.happy + 15); if (!p.digest) p.digest = 4;
      return { msg: 'Trop bon !', anim: { type: 'eat', food: 'candy', dur: 1400 } };
    case 'play':
      if (p.energy < 15) return { msg: `${p.name} est trop fatigué pour jouer.` };
      return { game: true };
    case 'clean':
      if (!p.poops && p.clean > 90) return { msg: 'Déjà tout propre !' };
      p.poops = 0; p.clean = 100;
      return { msg: 'Tout propre !', anim: { type: 'wash', dur: 1100 } };
    case 'heal':
      if (!p.sick) return { msg: `${p.name} n’est pas malade.` };
      p.sick = false; p.happy = clamp(p.happy - 5);
      return { msg: 'Guéri !', anim: { type: 'heal', dur: 1200 } };
    case 'light':
      p.sleeping = !p.sleeping;
      return { msg: p.sleeping ? 'Bonne nuit…' : 'Debout !' };
  }
  return {};
}

export function hatchTap(p) {
  if (p.hatched) return { msg: '' };
  p.hatchTaps++;
  if (p.hatchTaps >= 3) { p.hatched = true; p.ageMin = 0; p.last = Date.now(); return { msg: `${p.name} est né !`, hatched: true }; }
  return { msg: `Crac ! Encore ${3 - p.hatchTaps}…` };
}

export function cleanOne(p) {
  if (!p.poops) return { msg: '' };
  p.poops--; p.clean = clamp(p.clean + 20);
  return { msg: p.poops ? `Encore ${p.poops} à nettoyer` : 'Tout propre !' };
}

export function cuddle(p) {
  if (p.sleeping) return { msg: 'Chut, il dort.' };
  const now = Date.now();
  if (now - p.lastCuddle < 800) return { msg: '' };
  p.lastCuddle = now; p.happy = clamp(p.happy + 4);
  return { ok: true, msg: `${p.name} adore les câlins !` };
}

export function finishGame(p, wins) {
  const m = mods(p);
  p.happy = clamp(p.happy + (wins >= 3 ? 30 : 10) * m.play);
  p.energy = clamp(p.energy - 10);
}
