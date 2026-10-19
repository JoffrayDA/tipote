// Sauvegarde locale (dans le navigateur). Pour jouer en ligne avec des potes,
// c'est ce fichier qu'on remplacera par des appels à un serveur.
const KEY = 'tipote-save-v1';
const OLD_KEY = 'tamapote-save-v1'; // ancien nom du jeu

export function load() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY));
    return p && p.v === 1 ? p : null;
  } catch { return null; }
}

export function save(p) {
  try {
    if (p) { p.last = Date.now(); localStorage.setItem(KEY, JSON.stringify(p)); }
    else localStorage.removeItem(KEY);
  } catch { /* stockage indisponible : on continue sans sauvegarde */ }
}
