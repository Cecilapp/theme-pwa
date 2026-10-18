---
title: Home
---
This website uses the [PWA component theme](https://github.com/Cecilapp/theme-pwa) for [Cecil](https://cecil.app): it can be installed as an app, and works offline.

## Try it

1. Look at the **status** panel: the service worker is registered and the pages are precached.
2. **Go offline**: turn off your network, or check _Offline_ in the _Network_ (or _Application_) tab of your browser developer tools.
3. Open the [precached page](precached/): it is served from the cache.
4. Open the [uncached page](uncached/): as it is not in the cache, the offline page is displayed instead.
5. **Go back online**: the snackbar disappears, and the offline page reloads automatically.

## Generated files

- [`manifest.webmanifest`](manifest.webmanifest): the Web manifest
- [`serviceworker.js`](serviceworker.js): the service worker
- [`offline.html`](offline.html): the offline page
