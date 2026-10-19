// Les 9 espèces. `mods` multiplie les vitesses de base de pet.js :
// hunger, happy, energy, clean = vitesse à laquelle la jauge baisse
// poop = fréquence des cacas, sick = risque de maladie
// heal = récupération de santé, play = joie gagnée en jouant
// Pour ajouter une espèce : une entrée ici, et si besoin une nouvelle "part" dans sprites.js.

export const SPECIES = [
  { id: 'mochi',   name: 'Mochi',   kind: 'Boule',      shape: 'round',  parts: ['antennae'],
    trait: 'Équilibré. Parfait pour commencer.', mods: {} },
  { id: 'bloub',   name: 'Bloub',   kind: 'Baleine',    shape: 'wide',   parts: ['spout', 'fluke'], noFeet: true,
    trait: 'Grosse mangeuse, mais très calme : s’ennuie peu.', mods: { hunger: 1.3, happy: 0.6 } },
  { id: 'kitsu',   name: 'Kitsu',   kind: 'Renard',     shape: 'round',  parts: ['pointyEars', 'tail'],
    trait: 'Adore jouer, mais s’ennuie vite.', mods: { happy: 1.4, play: 1.5 } },
  { id: 'lapino',  name: 'Lapino',  kind: 'Lapin',      shape: 'tall',   parts: ['longEars'],
    trait: 'Toujours affamé.', mods: { hunger: 1.4 } },
  { id: 'pikou',   name: 'Pikou',   kind: 'Hérisson',   shape: 'wide',   parts: ['spikes'],
    trait: 'Costaud, tombe rarement malade.', mods: { sick: 0.4 } },
  { id: 'gribou',  name: 'Gribou',  kind: 'Grenouille', shape: 'wide',   parts: ['eyeBumps'], face: 'frog',
    trait: 'Se fiche un peu de la saleté.', mods: { clean: 0.5 } },
  { id: 'plume',   name: 'Plume',   kind: 'Oiseau',     shape: 'round',  parts: ['wings', 'crest'], face: 'beak',
    trait: 'Plein d’énergie, dort peu.', mods: { energy: 0.6 } },
  { id: 'caillou', name: 'Caillou', kind: 'Golem',      shape: 'square', parts: ['cracks'],
    trait: 'Mange peu, mais guérit lentement.', mods: { hunger: 0.6, heal: 0.5 } },
  { id: 'spectre', name: 'Spectre', kind: 'Fantôme',    shape: 'ghost',  parts: ['arms'], noFeet: true, float: true,
    trait: 'Ne fait presque jamais caca, mais réclame de l’attention.', mods: { poop: 0.2, happy: 1.5 } },
];

export const speciesById = id => SPECIES.find(s => s.id === id) || SPECIES[0];
