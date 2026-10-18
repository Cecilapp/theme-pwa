// Tests the files generated from the test site (`tests/site/_site`):
//   php tests/link.php
//   php cecil.phar build tests/site
//   php cecil.phar build tests/site --config=legacy.yml --output=_site-legacy
//   node --test tests/pwa.test.mjs
// The service worker runs with an in-memory Cache Storage and a fake network.
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const SITE = path.join(import.meta.dirname, 'site', '_site');
const ORIGIN = 'https://example.com';
const BASE = ORIGIN + '/my-repo/';
const read = file => fs.readFileSync(path.join(SITE, file), 'utf8');

describe('Web manifest', () => {
  for (const file of ['manifest.webmanifest', 'fr/manifest.webmanifest']) {
    test(`${file} is valid JSON`, () => {
      const manifest = JSON.parse(read(file));
      assert.equal(manifest.name, 'L\'atelier "test" & co');
      assert.equal(manifest.short_name, 'L\'atelier');
      assert.equal(manifest.lang, file.startsWith('fr') ? 'fr' : 'en');
      assert.deepEqual(manifest.display_override, ['window-controls-overlay', 'standalone']);
      assert.equal(manifest.icons.length, 4);
      assert.ok(manifest.icons.every(icon => icon.src.startsWith('/my-repo/')));
      if (!file.startsWith('fr')) {
        assert.equal(manifest.shortcuts.at(-1).name, 'About "us"');
      }
      assert.equal(manifest.serviceworker, undefined);
    });
  }
});

describe('Inline scripts', () => {
  for (const file of ['index.html', 'fr/index.html', 'offline.html']) {
    test(`${file} scripts are valid JavaScript`, () => {
      const scripts = [...read(file).matchAll(/<script>(.*?)<\/script>/gs)].map(m => m[1]);
      assert.ok(scripts.length > 0);
      scripts.forEach(script => new vm.Script(script));
    });
  }

  test('the service worker is registered without a hardcoded scope', () => {
    assert.match(read('index.html'), /\.register\('[^']*serviceworker\.js'\)/);
  });

  test('the snackbar is an accessible live region with a reload action', () => {
    const html = read('index.html');
    assert.match(html, /\.pwa-snackbar\{/);
    assert.match(html, /setAttribute\(.role.,.status.\)/);
    assert.match(html, /callback:\(\)=>window\.location\.reload\(\)/);
  });
});

describe('Deprecated 2.x options (root `manifest` and `serviceworker` keys)', () => {
  const readLegacy = file => fs.readFileSync(path.join(SITE, '..', '_site-legacy', file), 'utf8');

  test('are still applied', () => {
    assert.equal(JSON.parse(readLegacy('manifest.webmanifest')).theme_color, '#FF0000');
    assert.doesNotMatch(readLegacy('index.html'), /pwaSnackbar\.show\('New/);
    assert.match(read('index.html'), /pwaSnackbar\.show\('New/);
  });

  test('display a warning in debug mode only', () => {
    assert.match(readLegacy('index.html'), /console\.warn\('\[PWA\] The `manifest` and `serviceworker` options/);
    assert.doesNotMatch(read('index.html'), /console\.warn\('\[PWA\]/);
  });
});

describe('Technical pages', () => {
  test('are excluded from pages lists', () => {
    const list = read('index.html').match(/<ul id="pages">(.*?)<\/ul>/s)[1];
    assert.match(list, /<li>about<\/li>/);
    assert.doesNotMatch(list, /offline|manifest|serviceworker/);
  });

  test('the offline page uses the manifest colors and links to the home page', () => {
    const html = read('fr/offline.html');
    assert.match(html, /--pwa-offline-accent: #202020;/);
    assert.match(html, /<a href="\/my-repo\/fr\/">Aller à la page d'accueil<\/a>/);
  });
});

describe('Service worker', () => {
  const swSource = read('serviceworker.js');

  // fake network
  const net = { online: true, files: {}, calls: [] };
  async function fakeFetch(input) {
    const req = typeof input === 'string' ? new Request(new URL(input, BASE)) : input;
    net.calls.push(req.method + ' ' + req.url);
    if (!net.online) throw new TypeError('Failed to fetch');
    // every local URL exists (precached pages, etc.), unless its content is set
    const local = new URL(req.url).origin === ORIGIN;
    const body = net.files[req.url] ?? (local ? 'content of ' + req.url : undefined);
    const res = new Response(body ?? 'not found', { status: body === undefined ? 404 : 200 });
    Object.defineProperty(res, 'type', { value: new URL(req.url).origin === ORIGIN ? 'basic' : 'opaque' });
    return res;
  }

  // relative URLs are resolved against the service worker location, as in browsers
  class SWRequest extends Request {
    constructor(input, init) {
      super(typeof input === 'string' ? new URL(input, BASE) : input, init);
    }
  }

  // in-memory Cache Storage
  const keyOf = r => (typeof r === 'string' ? new URL(r, BASE).href : r.url);
  class FakeCache {
    constructor() { this.map = new Map(); }
    async match(r) { const e = this.map.get(keyOf(r)); return e ? e.clone() : undefined; }
    async put(r, res) { this.map.set(keyOf(r), res.clone()); }
    async add(r) {
      const res = await fakeFetch(r);
      if (!res.ok) throw new TypeError('Bad response');
      await this.put(r, res);
    }
  }
  const store = new Map();
  const caches = {
    async open(n) { if (!store.has(n)) store.set(n, new FakeCache()); return store.get(n); },
    async keys() { return [...store.keys()]; },
    async delete(n) { return store.delete(n); },
    async match(r) { for (const c of store.values()) { const m = await c.match(r); if (m) return m; } },
  };

  function loadSW({ version = '1', strategy } = {}) {
    const listeners = {};
    const self = {
      addEventListener: (type, listener) => (listeners[type] = listener),
      skipWaiting() {},
      clients: { claim: async () => {} },
      registration: { scope: BASE },
    };
    let src = swSource.replace(/var CACHE_VERSION = '[^']*';/, `var CACHE_VERSION = '${version}';`);
    if (strategy) {
      src = src.replace(/var PAGES_STRATEGY = '[^']*';/, `var PAGES_STRATEGY = '${strategy}';`);
    }
    vm.runInNewContext(src, {
      self, caches, fetch: fakeFetch, Request: SWRequest, Response, URL, console, Promise, Set,
      location: new URL(BASE + 'serviceworker.js'),
    });
    return listeners;
  }

  async function lifecycle(listeners) {
    for (const type of ['install', 'activate']) {
      const waits = [];
      listeners[type]({ waitUntil: p => waits.push(p) });
      await Promise.all(waits);
    }
  }

  async function request(listeners, url, { page = false, destination, method = 'GET' } = {}) {
    const req = new Request(new URL(url, ORIGIN), { method, headers: page ? { Accept: 'text/html' } : {} });
    if (destination) Object.defineProperty(req, 'destination', { value: destination });
    let responded = null;
    const waits = [];
    listeners.fetch({ request: req, respondWith: p => (responded = p), waitUntil: p => waits.push(p) });
    if (!responded) return { handled: false };
    const res = await responded;
    // lets background work (cache updates) complete
    await new Promise(resolve => setTimeout(resolve, 10));
    await Promise.allSettled(waits);
    return { handled: true, res, text: res.type === 'error' ? null : await res.text() };
  }

  const cached = async url => (await caches.match(url))?.text();

  let sw;
  beforeEach(async () => {
    store.clear();
    net.online = true;
    net.calls = [];
    net.files = {
      [BASE]: 'home v1',
      [BASE + 'offline.html']: 'offline en',
      [BASE + 'fr/offline.html']: 'offline fr',
      [BASE + 'style.css']: 'css v1',
      'https://cdn.example.org/image.png': 'image',
    };
    sw = loadSW();
    await lifecycle(sw);
  });

  test('install precaches pages and the offline page of every language', async () => {
    assert.equal(store.size, 1);
    const urls = [...[...store.values()][0].map.keys()];
    for (const url of [BASE, BASE + 'fr/', BASE + 'about/', BASE + 'offline.html', BASE + 'fr/offline.html']) {
      assert.ok(urls.includes(url), `${url} is precached`);
    }
  });

  test('install does not precache excluded pages (`pwa.precache` and 2.x `serviceworker.precache`)', async () => {
    const urls = [...[...store.values()][0].map.keys()];
    for (const url of [BASE + 'private/', BASE + 'legacy/', BASE + 'serviceworker.js']) {
      assert.ok(!urls.includes(url), `${url} is not precached`);
    }
  });

  test('pages (network-first): fresh content when online, and the cache is updated', async () => {
    net.files[BASE] = 'home v2';
    assert.equal((await request(sw, BASE, { page: true })).text, 'home v2');
    assert.equal(await cached(BASE), 'home v2');
  });

  test('pages offline: cached copy, else the offline page of the language', async () => {
    net.online = false;
    assert.equal((await request(sw, BASE, { page: true })).text, 'home v1');
    assert.equal((await request(sw, BASE + 'blog/', { page: true })).text, 'offline en');
    assert.equal((await request(sw, BASE + 'fr/blog/', { page: true })).text, 'offline fr');
  });

  test('pages (cache-first): cached page served, uncached page fetched', async () => {
    const swCacheFirst = loadSW({ strategy: 'cache-first' });
    net.files[BASE] = 'home v2';
    net.files[BASE + 'private/'] = 'private';
    assert.equal((await request(swCacheFirst, BASE, { page: true })).text, 'home v1');
    assert.equal((await request(swCacheFirst, BASE + 'private/', { page: true })).text, 'private');
  });

  test('assets (stale-while-revalidate): cached copy served, then refreshed', async () => {
    assert.equal((await request(sw, BASE + 'style.css')).text, 'css v1');
    net.files[BASE + 'style.css'] = 'css v2';
    assert.equal((await request(sw, BASE + 'style.css')).text, 'css v1');
    assert.equal((await request(sw, BASE + 'style.css')).text, 'css v2');
  });

  test('images offline: placeholder', async () => {
    net.online = false;
    const { res } = await request(sw, BASE + 'missing.png', { destination: 'image' });
    assert.equal(res.headers.get('Content-Type'), 'image/svg+xml');
  });

  test('cross-origin images: network only, not cached', async () => {
    const url = 'https://cdn.example.org/image.png';
    assert.equal((await request(sw, url, { destination: 'image' })).text, 'image');
    assert.equal(await caches.match(url), undefined);
  });

  test('ignored: HEAD requests, other origins (except images), ignored paths', async () => {
    assert.equal((await request(sw, BASE, { method: 'HEAD' })).handled, false);
    assert.equal((await request(sw, 'https://cdn.example.org/script.js')).handled, false);
    assert.equal((await request(sw, ORIGIN + "/admin'x/page")).handled, false);
  });

  test('update: the new version reuses cached responses and removes the old cache', async () => {
    net.calls = [];
    await lifecycle(loadSW({ version: '2' }));
    assert.deepEqual(net.calls, []);
    assert.equal(store.size, 1);
    assert.equal(await cached(BASE), 'home v1');
  });
});
