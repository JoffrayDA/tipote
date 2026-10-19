// Interface : écran de choix d'espèce, boutons, écran tactile, boucle de jeu.
import { SPECIES, speciesById } from './species.js';
import { petSprite, eggSprite, ICONS } from './sprites.js';
import * as Pet from './pet.js';
import * as Store from './storage.js';
import { createRenderer, drawPreview } from './render.js';

const $ = id => document.getElementById(id);
let pet = Store.load();

// ---------- Choix de l'espèce ----------
let chosen = SPECIES[0].id, nameTouched = false;

function buildSelect() {
  const grid = $('species-grid');
  grid.innerHTML = '';
  for (const sp of SPECIES) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'species'; b.id = 'sp-' + sp.id;
    b.setAttribute('aria-pressed', String(sp.id === chosen));
    const c = document.createElement('canvas');
    c.width = 120; c.height = 104;
    drawPreview(c, petSprite(sp.id, 'adult'));
    b.append(c);
    b.insertAdjacentHTML('beforeend', `<span class="kind">${sp.kind}</span><b>${sp.name}</b>`);
    b.addEventListener('click', () => pick(sp.id));
    grid.append(b);
  }
}
function pick(id) {
  chosen = id;
  document.querySelectorAll('.species').forEach(b => b.setAttribute('aria-pressed', String(b.id === 'sp-' + id)));
  const sp = speciesById(id);
  $('trait').innerHTML = `<b>${sp.name}</b> · ${sp.trait}`;
  if (!nameTouched) $('new-name').value = sp.name;
}
$('new-name').addEventListener('input', () => { nameTouched = true; });
$('adopt').addEventListener('click', () => {
  pet = Pet.createPet(chosen, $('new-name').value.trim() || speciesById(chosen).name);
  Store.save(pet);
  showPlay();
  say('Touche l’œuf 3 fois pour le faire éclore !', 5000);
});

function showSelect() {
  $('select').hidden = false; $('play').hidden = true;
  nameTouched = false; pick(chosen);
}
function showPlay() {
  $('select').hidden = true; $('play').hidden = false;
  $('pet-name').value = pet.name;
  Object.assign(sc, { pos: 32, anim: null, game: null, hearts: [] });
  renderKeys();
}

// ---------- Partie ----------
const renderer = createRenderer($('screen'));
const sc = { pos: 32, dir: 1, lastWander: 0, anim: null, game: null, hearts: [], cuddleUntil: 0 };
let frame = 0, hits = { poops: [], pet: null };
let msgText = '', msgUntil = 0;

function say(t, ms = 2200) { if (t) { msgText = t; msgUntil = performance.now() + ms; } }
const persist = () => Store.save(pet);

function onEvent(type, info) {
  if (type === 'poop') say('Oups, un caca ! Touche-le pour nettoyer.', 3500);
  else if (type === 'sick') say(`${pet.name} est malade : appuie sur Soigner.`, 3500);
  else if (type === 'dead') { sc.game = null; say(`${pet.name} s’est envolé…`, 1e9); renderKeys(); }
  else if (type === 'grow') say(info === 'child' ? `${pet.name} a grandi !` : `${pet.name} est adulte !`, 3500);
}

function idleMsg() {
  const st = Pet.stageOf(pet);
  if (st === 'dead') return `${pet.name} s’est envolé…`;
  if (st === 'egg') return 'Touche l’œuf pour le faire éclore';
  if (sc.game) return sc.game.phase === 'ask' ? `Manche ${sc.game.round + 1}/5 : où va-t-il regarder ?` : msgText;
  if (pet.sleeping) return 'Zzz… (Lumière pour le réveiller)';
  if (pet.sick) return 'Il est malade : Soigner !';
  if (pet.poops) return 'Touche le caca pour nettoyer';
  if (pet.hunger < 30) return 'Il a faim : Repas !';
  if (pet.energy < 25) return 'Il baille… éteins la lumière';
  if (pet.happy < 30) return 'Il s’ennuie : joue avec lui';
  return 'Touche-le pour un câlin';
}

function doAction(name) {
  if (sc.anim || sc.game) return;
  const r = Pet.act(pet, name);
  say(r.msg);
  if (r.anim) sc.anim = { ...r.anim, t0: performance.now() };
  if (r.game) sc.game = { round: 0, wins: 0, phase: 'ask', look: 0 };
  renderKeys(); persist();
}

function pickSide(side) {
  const g = sc.game;
  if (!g || g.phase !== 'ask') return;
  const look = Math.random() < 0.5 ? -1 : 1;
  g.phase = 'reveal'; g.look = look;
  if (look === side) g.wins++;
  say(look === side ? 'Gagné !' : 'Raté…', 900);
  setTimeout(() => {
    if (sc.game !== g) return;
    g.round++; g.look = 0;
    if (g.round >= 5) {
      Pet.finishGame(pet, g.wins);
      sc.game = null;
      sc.anim = { type: 'jump', dur: 1000, t0: performance.now() };
      say(`${g.wins}/5 · ${g.wins >= 3 ? 'Il adore !' : 'Pas mal !'}`, 2500);
      renderKeys(); persist();
    } else g.phase = 'ask';
  }, 900);
}

function renderKeys() {
  const keys = $('keys');
  keys.innerHTML = '';
  const add = (label, icon, onClick, cls = '') => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'key ' + cls;
    const cap = document.createElement('span');
    cap.className = 'cap';
    cap.append(iconCanvas(ICONS[icon]));
    b.append(cap, label);
    b.addEventListener('click', onClick);
    keys.append(b);
  };
  if (pet.dead) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pill'; b.textContent = 'Adopter un nouvel œuf';
    b.addEventListener('click', showSelect);
    keys.append(b);
    return;
  }
  if (sc.game) {
    add('Gauche', 'left', () => pickSide(-1));
    add('Arrêter', 'stop', () => { sc.game = null; renderKeys(); }, 'ghost');
    add('Droite', 'right', () => pickSide(1));
    return;
  }
  add('Repas', 'meal', () => doAction('meal'));
  add('Friandise', 'candy', () => doAction('candy'));
  add('Jouer', 'play', () => doAction('play'));
  add('Nettoyer', 'clean', () => doAction('clean'));
  add('Soigner', 'heal', () => doAction('heal'));
  add(pet.sleeping ? 'Allumer' : 'Éteindre', pet.sleeping ? 'wake' : 'sleep', () => doAction('light'));
}

// Icône en pixels blancs, centrée dans un carré 7 × 7
function iconCanvas(rows) {
  const s = 4, c = document.createElement('canvas');
  c.width = c.height = 7 * s;
  const g = c.getContext('2d');
  g.fillStyle = '#fff6f0';
  const oy = Math.floor((7 - rows.length) / 2), ox = Math.floor((7 - rows[0].length) / 2);
  rows.forEach((r, y) => [...r].forEach((ch, x) => ch === '#' && g.fillRect((ox + x) * s, (oy + y) * s, s, s)));
  return c;
}

// Écran tactile : œuf, cacas, câlins
$('screen').addEventListener('pointerdown', e => {
  if (!pet) return;
  const { x, y } = renderer.toLogical(e);
  const st = Pet.stageOf(pet);
  if (st === 'egg') { say(Pet.hatchTap(pet).msg, 3000); persist(); return; }
  if (st === 'dead' || sc.game) return;
  const inBox = b => b && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
  if (hits.poops.some(inBox)) { say(Pet.cleanOne(pet).msg); persist(); return; }
  if (inBox(hits.pet)) {
    const r = Pet.cuddle(pet);
    say(r.msg, 1500);
    if (r.ok) {
      const now = performance.now();
      sc.hearts.push({ x: hits.pet.x + hits.pet.w / 2, y: hits.pet.y + 2, t0: now });
      sc.cuddleUntil = now + 1200;
      persist();
    }
  }
});

$('pet-name').addEventListener('input', e => { pet.name = e.target.value.trim() || speciesById(pet.species).name; persist(); });

// Recommencer, en deux clics pour éviter les accidents
let armed = 0;
$('restart').addEventListener('click', () => {
  if (performance.now() < armed) { armed = 0; $('restart').textContent = 'Changer de compagnon'; showSelect(); return; }
  armed = performance.now() + 4000;
  $('restart').textContent = `Sûr ? ${pet.name} sera perdu. Clique encore.`;
  setTimeout(() => { if (performance.now() >= armed) $('restart').textContent = 'Changer de compagnon'; }, 4100);
});

// ---------- Stats ----------
const STATS = [['Faim', 'hunger'], ['Joie', 'happy'], ['Propreté', 'clean'], ['Énergie', 'energy'], ['Santé', 'health']];
$('stats').innerHTML = STATS.map(([l, k]) => `<span>${l}</span><div class="meter" id="m-${k}">${'<i></i>'.repeat(10)}</div>`).join('');
function renderStats() {
  for (const [, k] of STATS) {
    const m = $('m-' + k), n = Math.ceil(pet[k] / 10);
    m.classList.toggle('low', pet[k] < 25);
    [...m.children].forEach((c, i) => c.classList.toggle('on', i < n));
  }
  const a = Math.floor(pet.ageMin);
  $('age').textContent = !pet.hatched ? 'Œuf' : a < 60 ? `${a} min` : a < 1440 ? `${Math.floor(a / 60)} h` : `${Math.floor(a / 1440)} j`;
  $('lcd').classList.toggle('night', pet.sleeping);
}

// ---------- Boucle ----------
let lastT = performance.now(), lastFrame = 0, lastUI = 0, lastSave = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (!pet || $('play').hidden) { lastT = now; return; }
  const dm = (now - lastT) / 60000; lastT = now;
  if (dm > 0 && dm < 2) Pet.simulate(pet, dm, onEvent);

  if (now - lastFrame > 125) {
    frame++; lastFrame = now;
    const stage = Pet.stageOf(pet);
    if (sc.anim && now - sc.anim.t0 > sc.anim.dur) sc.anim = null;
    sc.hearts = sc.hearts.filter(h => now - h.t0 < 1000);

    const sprite = stage === 'egg' ? eggSprite(pet.species, pet.hatchTaps)
                 : stage === 'dead' ? null : petSprite(pet.species, stage);
    if (sprite && stage !== 'egg') {
      const half = sprite.w / 2 + 2;
      const free = !sc.anim && !sc.game && !pet.sleeping;
      if (free && now - sc.lastWander > 500) {
        sc.lastWander = now;
        if (Math.random() < 0.25) sc.dir *= -1;
        sc.pos += sc.dir * 2;
      }
      if (sc.game || pet.sleeping) sc.pos += (32 - sc.pos) * 0.2;
      if (sc.anim?.type === 'eat') sc.pos += (22 - sc.pos) * 0.3;
      if (sc.pos < half) { sc.pos = half; sc.dir = 1; }
      if (sc.pos > 64 - half) { sc.pos = 64 - half; sc.dir = -1; }
    }
    hits = renderer.draw({ pet, stage, sprite, sc, now, frame });
  }
  if (now - lastUI > 300) {
    lastUI = now;
    renderStats();
    $('msg').textContent = now < msgUntil ? msgText : idleMsg();
  }
  if (now - lastSave > 5000) { lastSave = now; persist(); }
}

document.addEventListener('visibilitychange', () => {
  if (!pet) return;
  if (document.hidden) persist();
  else { Pet.catchUp(pet, onEvent); lastT = performance.now(); renderKeys(); }
});
window.addEventListener('pagehide', () => pet && persist());

// ---------- Démarrage ----------
buildSelect();
if (pet) {
  Pet.catchUp(pet, onEvent);
  showPlay();
  say(pet.dead ? '' : `Re-bonjour ${pet.name} !`);
} else showSelect();
requestAnimationFrame(loop);

// Rend le jeu installable comme une appli (GitHub Pages / serveur local)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Nouvelle version installée alors que l'ancienne tournait : on recharge une fois pour l'afficher
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) { if (pet) persist(); location.reload(); }
  });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
