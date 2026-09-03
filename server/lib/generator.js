const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { scanDirectory, countFiles } = require('./scanner');
const { computeSha256, splitFile, copySmallFile } = require('./splitter');
const { __ } = require('./i18n');

// 加载 YAML 配置文件
const configPath = path.join(__dirname, '..', '_config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

async function processDirectory(inputDir, outputDir, maxChunkSize, chunkExtension) {
  const files = scanDirectory(inputDir, inputDir);

  for (const file of files) {
    await processEntry(file, inputDir, outputDir, maxChunkSize, chunkExtension);
  }

  return files;
}

async function processEntry(entry, inputDir, outputDir, maxChunkSize, chunkExtension) {
  if (entry.type === 'folder') {
    const folderOutputDir = path.join(outputDir, entry.path);
    if (!fs.existsSync(folderOutputDir)) {
      fs.mkdirSync(folderOutputDir, { recursive: true });
    }
    if (entry.children) {
      for (const child of entry.children) {
        await processEntry(child, inputDir, outputDir, maxChunkSize, chunkExtension);
      }
    }
  } else {
    const inputPath = path.join(inputDir, entry.path);
    const outputSubDir = path.join(outputDir, path.dirname(entry.path));

    if (!fs.existsSync(outputSubDir)) {
      fs.mkdirSync(outputSubDir, { recursive: true });
    }

    const sha256 = await computeSha256(inputPath);

    if (entry.size <= maxChunkSize) {
      const fileName = await copySmallFile(inputPath, outputSubDir);
      const sizeKB = (entry.size / 1000).toFixed(1);
      console.log(`  ${__('generator.small')} ${entry.path}  (${sizeKB} ${__('generator.kb')})  ${__('generator.sha256Label')}: ${sha256.substring(0, 16)}...`);

      entry.sha256 = sha256;
      entry.chunks = 1;
      entry.files = [fileName];
    } else {
      const { chunkFiles } = await splitFile(inputPath, outputSubDir, maxChunkSize, chunkExtension);
      const sizeMB = (entry.size / 1000000).toFixed(1);
      console.log(`  ${__('generator.large')} ${entry.path}  (${sizeMB} ${__('generator.mb')})  -> ${chunkFiles.length} ${__('generator.chunkSuffix')}  ${__('generator.sha256Label')}: ${sha256.substring(0, 16)}...`);

      entry.sha256 = sha256;
      entry.chunks = chunkFiles.length;
      entry.files = chunkFiles;
    }
  }
}

async function generateOutput(inputDir, outputDir, maxChunkSize) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = config.chunkExtension || 'rbpan';
  const files = await processDirectory(inputDir, outputDir, maxChunkSize, ext);
  console.log(`\n${__('generator.processingComplete', { n: countFiles(files) })}`);
  return files;
}

module.exports = { generateOutput };