# rbpan

A lightweight cloud drive system based on Node.js, with server and client as two fully independent projects.
Supports large file auto-chunking, multi-threaded download, and SHA-256 integrity verification.
The client uses Pug templates + Stylus styles + Vue.js, with acrylic dark theme and plugin extension support.

## Clone

Only the `main` branch contains source code. Other branches hold build outputs:

```bash
git clone -b main --single-branch https://github.com/rubingchupin/rbpan.git
```

| Branch | Content |
|--------|---------|
| `main` | Source code (this repo) |
| `server` | Server output — chunks + manifest.json |
| `client` | Client output — static site (dist/) |

Manifest URL: `https://pan-data.rubing.us.kg/manifest.json`

## Project Structure

```
rbpan/
├── README.md / README_CN.md
├── .gitignore
├── cli.js                      # CLI i18n helper
├── languages/                  # Root CLI language packs
│   ├── en.json
│   └── zh-CN.json
├── build.bat / build.sh        # Build both projects
├── dev.bat / dev.sh            # Local dev servers
├── push.bat / push.sh          # Git push (optimized: shallow fetch + skip no-changes)
│
├── server/                     # Independent server project
│   ├── README.md / README_CN.md
│   ├── package.json
│   ├── _config.yml             # Server config (YAML format)
│   ├── index.js                # Entry point
│   ├── input/                  # Place files to share
│   ├── output/                 # Generated chunks + manifest.json
│   ├── languages/              # Server CLI language packs (JSON)
│   ├── lib/
│   │   └── i18n.js             # Server i18n helper
│   └── src/
│       ├── scanner.js          # Directory scanner
│       ├── splitter.js         # Chunking + SHA-256
│       └── generator.js        # Output generator
│
└── client/                     # Independent client project
    ├── README.md / README_CN.md
    ├── package.json
    ├── _config.yml             # Site config (YAML format)
    ├── build.js                # Build script
    ├── dist/                   # Build output (deployable)
    ├── languages/              # Client CLI language packs (JSON)
    ├── lib/
    │   └── i18n.js             # Client i18n helper
    └── themes/
        └── default/            # Default theme
            ├── _config.js      # Theme config
            ├── layout/         # Pug templates
            ├── source/         # Theme assets (CSS, JS, fonts, images)
            └── languages/      # UI multi-language (JSON)
```

## Quick Start

### Root-level scripts

Run from the project root:

| Script | Description |
|--------|-------------|
| `build.bat` / `build.sh` | Build both server and client |
| `dev.bat` / `dev.sh` | Build + start local dev servers (frontend :3000, backend :3001) |
| `push.bat` / `push.sh` | Build (optional) + Git push with 3 modes and branch selection |

### CLI Language

Each project has its own `cliLang` option to control terminal output language:

- **Server**: set in `server/_config.yml` → `cliLang: 'en'` or `'zh-CN'`
- **Client**: set in `client/_config.yml` → `cliLang: 'en'` or `'zh-CN'`

### Step 1: Server - Generate chunks

See [server/README.md](server/README.md) for detailed server instructions.

### Step 2: Client - Build the frontend

See [client/README.md](client/README.md) for detailed client instructions.

## Configuration Reference

### Server config (server/_config.yml)

| Option | Description | Default |
|--------|-------------|---------|
| `cliLang` | CLI language (`'en'` \| `'zh-CN'`) | `'en'` |
| `inputDir` | Input directory | `'./input'` |
| `outputDir` | Output directory | `'./output'` |
| `maxChunkSize` | Chunk size in bytes | `25000000` (25 MB) |
| `baseUrl` | Base URL for deployed files | `''` |
| `git.repoUrl` | Git repository URL | (required) |
| `git.repoBranch` | Target branch | `'main'` |
| `git.autoPush` | Auto-push after generation | `false` |
| `git.commitMessage` | Commit message | `'Update: rbpan files'` |

### Client site config (client/_config.yml)

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
| `bgImage` | Background image URL | `'./img/bg.png'` |
| `font.family` | Global font family name | `''` |
| `font.files` | Custom font files | `[]` |
| `customCss` | External CSS URLs | `[]` |

### Font Configuration Example

```yaml
font:
  family: 'MyCustomFont'
  files:
    - path: './fonts/my-font-regular.woff2'
      weight: normal
      style: normal
    - path: './fonts/my-font-bold.woff2'
      weight: bold
      style: normal
```

Supported font formats: `woff2`, `woff`, `ttf`, `otf`

## Features

- **Auto-chunking**: Files exceeding the size limit are split into `.rbpan1`, `.rbpan2`... chunks
- **Multi-threaded download**: Configurable parallel download threads
- **SHA-256 verification**: Server computes hashes; client verifies after merge
- **Multi-language UI**: Built-in Chinese, English, Traditional Chinese, Japanese, Korean, one-click toggle
- **CLI i18n**: Terminal output language selectable per project via `cliLang`
- **Vue.js frontend**: Vue 3, Pug + Stylus, all inlined at build time
- **Acrylic UI**: Frosted glass effect, gradient backgrounds, smooth animations
- **Dark theme**: Light/dark dual theme, CSS variable driven
- **Plugin system**: Extensible plugin registry with lifecycle hooks
- **404 page**: Auto-adapts to theme
- **Git integration**: Auto-push to Git repositories (optimized: shallow fetch + skip no-changes)
- **Pure frontend deployment**: Single HTML file, deployable to Cloudflare Pages
- **Theme extensible**: New themes by adding folders under `client/themes/`
- **Custom fonts**: Support for custom font files with configurable weight and style
- **YAML configuration**: All config files use YAML format for better readability

## How It Works

### Chunk naming
File `large-file.zip` (> 25 MB) → chunks:
- `large-file.zip.rbpan1`
- `large-file.zip.rbpan2`
- `large-file.zip.rbpan3`

### Multi-threaded download
1. Client reads chunk info from manifest.json
2. Creates N worker threads, fetching chunks in parallel
3. Merges chunks in order after all complete
4. Computes SHA-256 and compares against manifest hash
5. Triggers browser download on verification pass