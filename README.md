# PWA component theme

The _PWA_ component theme for [Cecil](https://cecil.app) provides helpers to implement a [Web manifest](https://developer.mozilla.org/docs/Web/Manifest) and a [service worker](https://developer.mozilla.org/docs/Web/API/Service_Worker_API) to turn a website into a [Progressive Web App](https://web.dev/explore/progressive-web-apps).

## Features

- Generated and configurable **Web manifest**
- Generated and configurable **service worker**
- **Automatic caching** of visited resources
- **No dependencies**, vanilla JavaScript
- **Precaching** of assets and published pages
- **Offline support** and image placeholder
- Custom **install button** support instead of browser prompt

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

> [!NOTE]
> The `icons` section is optional. If not provided, the theme will generate a default set of icons based on the `icon.png` file in the _assets_ directory of your website.

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

Icons are precached by default. To disable this behavior:

```yaml
serviceworker:
  install:
    precache:
      icons: false
```

By default all published pages are precached. To limit this number:

```yaml
serviceworker:
  install:
    precache:
      pages:
        limit: 10
```

Set list of precached assets:

```yaml
serviceworker:
  install:
    precache:
      assets:
        - logo.png
```

Display a snackbar on update and connection lost:

```yaml
serviceworker:
  update:
    snackbar: true
  offline:
    snackbar: true
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
