# rbpan - Client

Independent client project for the rbpan cloud drive system.
Builds a single-page frontend with Pug + Stylus + Vue.js, with acrylic dark theme and plugin support.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Edit `_config.yml`:
   ```yaml
   title: 'rbpan'
   subtitle: 'rbpan'
   description: 'Lightweight cloud drive system'
   language: 'zh-CN'                              # 'zh-CN' | 'en'
   cliLang: 'en'                                  # 'en' | 'zh-CN'

   manifestUrl: 'https://yourname.github.io/repo-name/manifest.json'
   downloadThreads: 6
   theme: 'default'
   defaultTheme: 'light'
   plugins: []
   outputDir: './dist'
   devPort: 3000

   deploy:
     repoUrl: 'https://github.com/yourname/rbpan-client.git'
     repoBranch: 'main'
   ```

3. Build:
   ```bash
   npm run build
   ```

   Or build and start local preview:
   ```bash
   npm start
   ```

4. After build, `dist/index.html` is a single file with inline Vue 3, CSS, and all JS.

## npm Commands

```bash
npm install          # Install dependencies
npm run build        # Build frontend
npm start            # Build + start local preview (http://localhost:3000)
npm run clean        # Clean build output
```

## Deploy

Deploy `dist/` to Cloudflare Pages or any static hosting platform.

## Configuration

| Option | Description | Default |
|--------|-------------|---------|
| `title` | Site title | `'rbpan'` |
| `subtitle` | Site subtitle | `'rbpan'` |
| `language` | UI language (`'zh-CN'` \| `'en'`) | `'zh-CN'` |
| `cliLang` | CLI language (`'en'` \| `'zh-CN'`) | `'en'` |
| `manifestUrl` | Full manifest.json URL | (required) |
| `downloadThreads` | Download threads | `6` |
| `theme` | Theme folder name | `'default'` |
| `defaultTheme` | Default theme mode | `'light'` |
| `plugins` | Enabled plugins | `[]` |
| `outputDir` | Build output directory | `'./dist'` |
| `devPort` | Dev server port | `3000` |
| `deploy.repoUrl` | Client deploy repo URL | (required) |
| `deploy.repoBranch` | Client deploy branch | `'main'` |

## File Structure

```
client/
├── README.md / README_CN.md
├── package.json
├── _config.yml         # Site config (YAML format)
├── build.js            # Build script
├── dist/               # Build output (deployable)
├── languages/          # CLI language packs
│   ├── en.js
│   └── zh-CN.js
├── lib/
│   └── i18n.js         # i18n helper
└── themes/
    └── default/        # Default theme
        ├── _config.js  # Theme config
        ├── layout/     # Pug templates
        │   ├── index.pug
        │   └── 404.pug
        ├── source/     # Theme assets
        │   ├── css/
        │   │   ├── style.styl
        │   │   └── _theme/
        │   │       ├── light.styl
        │   │       └── dark.styl
        │   ├── js/
        │   │   ├── app.js
        │   │   ├── downloader.js
        │   │   └── hashVerifier.js
        │   └── plugin/
        │       └── registry.js
        └── languages/  # UI multi-language
            ├── zh-CN.js
            └── en.js
```

## Theme Development

Create a new theme folder under `client/themes/`:

```
client/themes/your-theme/
├── _config.js           # Theme config
├── layout/              # Pug layout templates
├── source/              # Asset files
│   ├── css/
│   │   ├── style.styl
│   │   └── _theme/
│   ├── js/
│   │   └── app.js
│   └── plugin/
└── languages/           # UI multi-language
```

Then set `theme` to your theme folder name in `_config.js`.

## Theme Config

| Option | Description | Default |
|--------|-------------|---------|
| `name` | Theme name | `'default'` |
| `version` | Theme version | `'1.0.0'` |
| `acrylic.blur` | Acrylic blur amount | `24` |
| `acrylic.saturation` | Acrylic saturation | `180` |
| `acrylic.opacity` | Panel opacity | `0.72` |
| `animation.enable` | Enable animations | `true` |
| `animation.speed` | Transition speed | `0.2` |