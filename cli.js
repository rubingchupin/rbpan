const path = require('path');
const fs = require('fs');

const lang = (() => {
  try {
    const cfg = require('./git-config');
    return cfg.cliLang || 'zh-CN';
  } catch (e) {
    return 'zh-CN';
  }
})();

let strings = {};
try {
  const langFile = path.join(__dirname, 'server', 'languages', `${lang}.json`);
  if (fs.existsSync(langFile)) {
    strings = JSON.parse(fs.readFileSync(langFile, 'utf-8'));
  }
} catch (e) {
  try {
    strings = JSON.parse(fs.readFileSync(path.join(__dirname, 'server', 'languages', 'zh-CN.json'), 'utf-8'));
  } catch (e2) {
    strings = {};
  }
}

function __(key, replacements) {
  const keys = key.split('.');
  let value = strings;
  for (const k of keys) {
    if (value == null) break;
    value = value[k];
  }
  if (typeof value !== 'string') return key;
  if (replacements) {
    return value.replace(/\{(\w+)\}/g, (_, name) => replacements[name] != null ? replacements[name] : `{${name}}`);
  }
  return value;
}

const key = process.argv[2];
if (key === '--all') {
  // 输出所有 root 翻译为 JSON
  process.stdout.write(JSON.stringify(strings.root || {}));
} else if (key) {
  const replacements = {};
  for (let i = 3; i < process.argv.length; i += 2) {
    replacements[process.argv[i]] = process.argv[i + 1] || '';
  }
  process.stdout.write(__(key, replacements));
} else {
  console.log('Usage: node cli.js <key> [replacements...]');
  console.log('       node cli.js --all');
}