const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 加载 YAML 配置文件
const configPath = path.join(__dirname, '..', '_config.yml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

const lang = config.cliLang || 'zh-CN';
const langFile = path.join(__dirname, '..', 'languages', `${lang}.json`);

let strings = {};
try {
  strings = JSON.parse(fs.readFileSync(langFile, 'utf-8'));
} catch (e) {
  strings = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'languages', 'zh-CN.json'), 'utf-8'));
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

module.exports = { __, lang };