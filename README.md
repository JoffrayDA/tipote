# Tipote

Un animal virtuel façon Tamagotchi, en pixels, jouable dans le navigateur (ordi et téléphone).

- 9 espèces au choix, chacune avec son caractère (faim, ennui, maladie…)
- L'œuf éclot quand on le touche, puis l'animal grandit : bébé (30 min), enfant (6 h), adulte
- Repas, friandise, mini-jeu, nettoyage, soins, lumière pour dormir
- Écran tactile : toucher l'animal fait un câlin, toucher un caca le nettoie
- Il continue de vivre quand la page est fermée (rattrapage jusqu'à 24 h)

## Lancer le jeu

Le code utilise des modules JavaScript : il faut passer par un petit serveur, ouvrir `index.html` en double-cliquant ne marche pas.

```bash
npx serve .
```

Pour y jouer sur téléphone : activer **GitHub Pages** sur le repo (Settings → Pages → branche `main`, dossier racine), puis ouvrir le lien sur le téléphone et l'ajouter à l'écran d'accueil.

## Organisation

| Fichier | Rôle |
| --- | --- |
| `src/species.js` | Les 9 espèces et leurs caractères |
| `src/sprites.js` | Dessins en pixels générés à partir de la forme de chaque espèce |
| `src/pet.js` | Règles du jeu : jauges, temps qui passe, actions. Pas de DOM |
| `src/storage.js` | Sauvegarde (navigateur pour l'instant) |
| `src/render.js` | Dessin de l'écran LCD |
| `src/main.js` | Interface, boutons, boucle de jeu |

**Ajouter une espèce** : une entrée dans `species.js`. Si elle a un morceau nouveau (cornes, nageoires…), ajouter une fonction dans `PARTS` de `sprites.js`.

## Pistes pour jouer entre potes

Rien de tout ça n'est fait. C'est la direction prévue, et le code est découpé pour :

- `pet.js` n'utilise pas le navigateur, il peut tourner tel quel sur un serveur
- `storage.js` est le seul endroit à remplacer pour sauvegarder en ligne (Supabase, Firebase, ou un petit serveur Node)
- Idées : codes amis, visiter l'animal d'un pote, aventures à plusieurs où chaque espèce apporte un avantage
