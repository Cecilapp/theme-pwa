---
title: Accueil
---
Ce site utilise le [thème composant PWA](https://github.com/Cecilapp/theme-pwa) pour [Cecil](https://cecil.app) : il peut être installé comme une application et fonctionne hors ligne.

## Essayez

1. Regardez le panneau **état** : le service worker est enregistré et les pages sont précachées.
2. **Passez hors ligne** : coupez votre réseau, ou cochez _Offline_ dans l'onglet _Network_ (ou _Application_) des outils de développement de votre navigateur.
3. Ouvrez la [page précachée](precached/) : elle est servie depuis le cache.
4. Ouvrez la [page non cachée](uncached/) : comme elle n'est pas en cache, la page hors ligne s'affiche à la place.
5. **Repassez en ligne** : la snackbar disparaît et la page hors ligne se recharge automatiquement.

## Fichiers générés

- [`manifest.webmanifest`](manifest.webmanifest) : le Web manifest
- [`serviceworker.js`](../serviceworker.js) : le service worker
- [`offline.html`](offline.html) : la page hors ligne
