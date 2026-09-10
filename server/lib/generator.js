const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { scanDirectory, countFiles } = require('./scanner');
const { processFile } = require('./splitter');
const { __ } = require('./i18n');

const configPath = path.join(__dirname, '..', '_config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

async function processDirectory(inputDir, outputDir, maxChunkSize, chunkExtension) {
  const files = await scanDirectory(inputDir, inputDir);

  const flat = [];
  function flatten(list) {
    for (const item of list) {
      if (item.type === 'folder') {
        const dir = path.join(outputDir, item.path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (item.children) flatten(item.children);
      } else {
        flat.push(item);
      }
    }
  }
  flatten(files);

  let completed = 0;
  let failed = 0;
  const total = flat.length;
  const startTime = Date.now();

  async function processOne(file) {
    try {
      const inputPath = path.join(inputDir, file.path);
      const outputSubDir = path.join(outputDir, path.dirname(file.path));
      if (!fs.existsSync(outputSubDir)) fs.mkdirSync(outputSubDir, { recursive: true });

      const result = await processFile(inputPath, outputSubDir, maxChunkSize, chunkExtension);
      file.sha256 = result.sha256;
      file.chunks = result.chunks;
      file.files = result.chunkFiles;
      completed++;
    } catch (err) {
      failed++;
      console.error(`  [FAIL] ${file.path}: ${err.message}`);
      file._error = err.message;
    }

    const elapsed = (Date.now() - startTime) / 1000;
    const speed = (completed + failed) / elapsed;
    const eta = speed > 0 ? (total - completed - failed) / speed : 0;

    if (file.chunks === 1) {
      console.log(`  [${completed + failed}/${total}] ${__('generator.small')} ${file.path}  (${(file.size / 1000).toFixed(1)} ${__('generator.kb')})  ${eta.toFixed(0)}s`);
    } else if (file.chunks > 1) {
      console.log(`  [${completed + failed}/${total}] ${__('generator.large')} ${file.path}  (${(file.size / 1000000).toFixed(1)} ${__('generator.mb')})  -> ${file.chunks} ${__('generator.chunkSuffix')}  ${eta.toFixed(0)}s`);
    }
  }

  const running = new Set();
  for (let i = 0; i < flat.length; i++) {
    const p = processOne(flat[i]);
    running.add(p);
    p.finally(() => running.delete(p));
    if (running.size >= 3) await Promise.race(running);
  }
  await Promise.all(running);

  if (failed > 0) {
    console.log(`\n  ${__('generator.failed') || 'Failed'}: ${failed}/${total}`);
  }

  return files;
}

async function generateOutput(inputDir, outputDir, maxChunkSize) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const ext = config.chunkExtension || 'rbpan';
  const files = await processDirectory(inputDir, outputDir, maxChunkSize, ext);
  console.log(`\n${__('generator.processingComplete', { n: countFiles(files) })}`);
  return files;
}

module.exports = { generateOutput };