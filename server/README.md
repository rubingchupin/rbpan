# rbpan - Server

Independent server project for the rbpan cloud drive system.
Scans files, generates chunks for large files, and produces a manifest with SHA-256 hashes.

## Quick Start

1. Create the `input` folder and place your files and folders inside:
   ```
   server/
   └── input/
       ├── docs/
       │   ├── guide.pdf
       │   └── tutorial.docx
       ├── photo.jpg
       └── large-file.zip
   ```

2. Edit `config.js`:
   ```js
   module.exports = {
     cliLang: 'en',                  // 'en' | 'zh-CN'
     inputDir: './input',
     outputDir: './output',
     maxChunkSize: 25 * 1000 * 1000, // 25 MB
     baseUrl: '',

     git: {
       repoUrl: 'https://github.com/yourname/your-repo.git',
       repoBranch: 'main',
       autoPush: false,
       commitMessage: 'Update: rbpan files',
     },
   };
   ```

3. Run:
   ```bash
   node index.js
   ```

4. Generated files in `output/`:
   - `manifest.json` — file manifest (with SHA-256 hashes)
   - Small files copied directly, large files split into `.rbpan1`, `.rbpan2`...

## Deploy

Deploy `output/` to GitHub Pages or any static hosting. Get the manifest.json URL:
```
https://yourname.github.io/repo-name/manifest.json
```

## Configuration

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

## File Structure

```
server/
├── README.md / README_CN.md
├── package.json
├── config.js           # Server config
├── index.js            # Entry point
├── input/              # Place files to share
├── output/             # Generated chunks + manifest.json
├── languages/          # CLI language packs
│   ├── en.json
│   └── zh-CN.json
└── lib/                # Core libraries
    ├── i18n.js         # i18n helper
    ├── scanner.js      # Directory scanner
    ├── splitter.js     # Chunking + SHA-256
    └── generator.js    # Output generator
```

## How It Works

1. `scanner.js` recursively scans the `input/` directory
2. For each file, `splitter.js` computes SHA-256
3. Files ≤ `maxChunkSize` are copied directly
4. Files > `maxChunkSize` are split into `.rbpan1`, `.rbpan2`... chunks
5. `generator.js` produces `manifest.json` with all file metadata and hashes