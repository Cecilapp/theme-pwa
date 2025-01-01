# PWA component theme

The _PWA_ component theme for [Cecil](https://cecil.app) provides helpers to implement a [Web manifest](https://developer.mozilla.org/docs/Web/Manifest) and a [service worker](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) to turn a website into a [Progressive Web App](https://web.dev/explore/progressive-web-apps).

## Features

- Generated and configurable **Web manifest**
- Generated and configurable **service worker**
- **Automatic caching** of visited resources
- **No dependencies**, vanilla JavaScript
- **Precaching** of assets and published pages
- **Offline support** and image placeholder

## Prerequisites

- A [Cecil](https://cecil.app) website
- A [supported browser](https://caniuse.com/serviceworkers)
- HTTPS

## Installation

```bash
composer require cecil/theme-pwa
```

> Or [download the latest archive](https://github.com/Cecilapp/theme-pwa/releases/latest/) and uncompress its content in `themes/pwa`.

## Usage

Add `pwa` in the `theme` section of the `config.yml`:

```yaml
theme:
  - pwa
```

Add the following line in the HTML `<header>` of the main template:

```twig
{{ include('partials/pwa.html.twig', {site}, with_context = false) }}
```

### Web manifest

Configure [web manifest](https://developer.mozilla.org/docs/Web/Manifest) options:

```yaml
manifest:
  background_color: '#FFFFFF'
  theme_color: '#202020'
  icons:
    - icon-192x192.png
    - icon-512x512.png
    - src: icon-192x192-maskable.png
      purpose: maskable
    - src: icon-512x512-maskable.png
      purpose: maskable
```

> [!TIP]
> Create your own [maskable icons](https://web.dev/articles/maskable-icon) with [Maskable.app](https://maskable.app/editor).

#### Web manifest Optional

Add [shortcuts](https://developer.mozilla.org/docs/Web/Manifest/shortcuts) from the `main` menu entries:

```yaml
manifest:
  shortcuts: true
```

Provide [installer screenshots](https://developer.mozilla.org/docs/Web/Manifest/screenshots):

```yaml
manifest:
  screenshots:
    - screenshots/desktop.png
    - screenshots/mobile.png
```

### Service worker

Enable the service worker:

```yaml
serviceworker:
  enabled: true
```

#### Service worker Optional

Disable browser install prompt, and use custom install button:

```yaml
serviceworker:
  install:
    prompt: false
    button: '#install-button' # query selector
```

```html
<button id="install-button" hidden>Install App</button>
```

Set list of precached assets:

```yaml
serviceworker:
  install:
    precache:
      assets:
        - logo.png
```

By default all published pages are precached. To limit this number:

```yaml
serviceworker:
  install:
    precache:
      pages:
        limit: 10
```

Display a snackbar on update or connection lost:

```yaml
serviceworker:
  update:
    snackbar:
      enabled: true
  offline:
    snackbar:
      enabled: true
```

Define ignored paths:

```yaml
serviceworker:
  ignore:
    - name: 'cms'
      path: '/admin'
```

Do not precache a specific page (through its front matter):

```yaml
---
serviceworker:
  precache: false
---
```
