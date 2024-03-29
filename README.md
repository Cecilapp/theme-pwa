# PWA component theme

The _PWA_ component theme for [Cecil](https://cecil.app) provides helpers to implement a [Web manifest](https://developer.mozilla.org/docs/Web/Manifest) and a [service worker](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) to turn a website into a [Progressive Web App](https://web.dev/explore/progressive-web-apps).

## Features

- Generated and configurable Web manifest
- Generated and configurable service worker
- Automatic caching of visited resources
- No dependencies, vanilla JavaScript
- Precaching of published pages
- Precaching of a list of assets
- Generic offline page and default image (SVG)

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

### Web manifest

Add the [web manifest](https://developer.mozilla.org/docs/Web/Manifest) in the HTML `<header>` of the main template:

```twig
<link rel="manifest" href="{{ url('manifest') }}">
```

Configure it:

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

Add [shortcuts](https://developer.mozilla.org/docs/Web/Manifest/shortcuts):

```yaml
manifest:
  shortcuts: true
```

Add [installer screenshots](https://developer.mozilla.org/docs/Web/Manifest/screenshots):

```yaml
manifest:
  screenshots:
    - screenshots/screenshot-desktop.png
    - screenshots/screenshot-mobile.png
```

### Service worker

**Register** the service worker before the end of the HTML `</body>` of the main template:

```twig
{{ include('partials/regsw.js.twig', {site: site}, with_context = false) }}
```

Enable the service worker:

```yaml
serviceworker:
  enabled: true
```

#### Service worker Optional

Define precached assets:

```yaml
serviceworker:
  install:
    precache:
      assets:
        - logo.png
        - icon-192x192.png
        - icon-512x512.png
        - icon-192x192-maskable.png
        - icon-512x512-maskable.png
```

Limit number of precached pages:

```yaml
serviceworker:
  install:
    precache:
      pages:
        limit: 10
```

Disable install prompt:

```yaml
serviceworker:
  install:
    prompt: false
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
