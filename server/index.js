const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

// 加载 YAML 配置文件
const configPath = path.join(__dirname, '_config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const { generateOutput } = require('./lib/generator');
const { __ } = require('./lib/i18n');

async function main() {
  console.log(__('server.banner') + '\n');

  const inputDir = path.resolve(config.inputDir);
  const outputDir = path.resolve(config.outputDir);
  const maxChunkSize = config.maxChunkSize;
  const baseUrl = config.baseUrl || '';

  if (!fs.existsSync(inputDir)) {
    console.error(`${__('server.inputNotFound')} "${inputDir}"`);
    console.log(__('server.inputNotFoundHint'));
    fs.mkdirSync(inputDir, { recursive: true });
    console.log(__('server.inputCreated'));
    process.exit(1);
  }

  const chunkSizeMB = (maxChunkSize / 1000000).toFixed(0);
  console.log(`${__('server.inputDir')}:  ${inputDir}`);
  console.log(`${__('server.outputDir')}: ${outputDir}`);
  console.log(`${__('server.chunkSize')}: ${chunkSizeMB} MB`);
  console.log(`${__('server.baseUrl')}:   ${baseUrl || __('server.relativePath')}\n`);

  console.log(__('server.scanning') + '\n');

  const files = await generateOutput(inputDir, outputDir, maxChunkSize);

  const manifest = {
    name: 'rbpan',
    nameCN: 'rbpan',
    version: '2.0',
    generatedAt: new Date().toISOString(),
    baseUrl: baseUrl,
    chunkExtension: config.chunkExtension || 'rbpan',
    files: files,
  };

  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n${__('server.manifestGenerated')}: ${manifestPath}`);

  const headersPath = path.join(outputDir, '_headers');
  fs.writeFileSync(headersPath, '/*\n  Access-Control-Allow-Origin: *\n', 'utf-8');

  console.log('\n════════════════════════════════════════════');
  console.log(`  ${__('server.processingComplete')}`);
  console.log('════════════════════════════════════════════');
  console.log(`\n${__('server.outputDirLabel')}: ${outputDir}`);
  console.log(__('server.deployHint'));

  if (config.git.autoPush && config.git.repoUrl) {
    await pushToGit(outputDir);
  }
}

async function pushToGit(outputDir) {
  console.log(`\n${__('server.pushBanner')}\n`);

  try {
    if (fs.existsSync(path.join(outputDir, '.git'))) {
      fs.rmSync(path.join(outputDir, '.git'), { recursive: true, force: true });
    }

    console.log(__('server.initGit'));
    execSync('git init', { cwd: outputDir, stdio: 'inherit' });

    console.log(`${__('server.addingRemote')}: ${config.git.repoUrl}`);
    execSync(`git remote add origin ${config.git.repoUrl}`, { cwd: outputDir, stdio: 'inherit' });

    console.log(__('server.addingFiles'));
    execSync('git config core.autocrlf false', { cwd: outputDir, stdio: 'inherit' });
    execSync('git add -A', { cwd: outputDir, stdio: 'inherit' });

    console.log(__('server.committing'));
    try {
      execSync(`git commit --allow-empty -m "${config.git.commitMessage}"`, { cwd: outputDir, stdio: 'inherit' });
    } catch {
    }

    console.log(__('server.pushing'));
    execSync(`git push -u origin HEAD:${config.git.repoBranch} --force`, { cwd: outputDir, stdio: 'inherit' });

    console.log(`\n${__('server.pushSuccess')}`);
  } catch (err) {
    console.error(`\n${__('server.pushFailed')}:`, err.message);
    console.log(__('server.pushFailedHint'));
  }
}

main().catch((err) => {
  console.error(`${__('server.processError')}:`, err);
  process.exit(1);
});