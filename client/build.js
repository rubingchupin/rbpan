const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const pug = require('pug');
const stylus = require('stylus');
const esbuild = require('esbuild');

// 确保 Windows 控制台正确输出 UTF-8 中文（避免叠字）
if (process.platform === 'win32') {
  const { execSync } = require('child_process');
  try { execSync('chcp 65001 > nul', { stdio: 'ignore' }); } catch (e) {}

  console.log = function(...args) {
    let msg = args.join(' ');
    msg = msg.replace(/\n/g, '\r\n');
    process.stdout.write(msg + '\r\n');
  };
  console.warn = function(...args) {
    let msg = args.join(' ');
    msg = msg.replace(/\n/g, '\r\n');
    process.stderr.write(msg + '\r\n');
  };
  console.error = function(...args) {
    let msg = args.join(' ');
    msg = msg.replace(/\n/g, '\r\n');
    process.stderr.write(msg + '\r\n');
  };
}

// 加载 YAML 配置文件
const configPath = path.join(__dirname, '_config.yml');
const siteConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
const { __, lang } = require('./lib/i18n');

const themeName = siteConfig.theme || 'default';
const themeDir = path.join(__dirname, 'themes', themeName);
let themeConfig = {};
try {
  themeConfig = require(path.join(themeDir, '_config'));
} catch (e) {
  console.warn(`  ${__('client.themeConfigNotFound')} "${themeName}", ${__('client.usingDefaults')}`);
}

const outputDir = path.resolve(siteConfig.outputDir || './dist');

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

const clientSourceDir = path.join(__dirname, 'source');
if (fs.existsSync(clientSourceDir)) {
  copyDirSync(clientSourceDir, outputDir);
  console.log(`  ${__('client.sourceCopied') || 'source/ 已复制到输出目录'}`);
}

function copyDirSync(src, dest, skip) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (skip && skip.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, skip);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`\n  ${__('client.site')}:   ${siteConfig.title} (${siteConfig.subtitle})`);
console.log(`  ${__('client.theme')}:  ${themeConfig.name || themeName} v${themeConfig.version || '1.0.0'}`);
console.log(`  ${__('client.lang')}:   ${siteConfig.language}`);
console.log(`  ${__('client.minify')}:  ${siteConfig.minify !== false ? 'ON' : 'OFF'}`);
console.log(`  ${__('client.beautify')}: ${siteConfig.beautify !== false ? 'ON' : 'OFF'}`);

const ieCompat = siteConfig.ieCompat !== false;
if (ieCompat) {
  console.log(`  ${__('client.ieCompat') || 'IE Compatibility'}: ON`);
}

const vuePath = path.join(__dirname, 'node_modules', 'vue', 'dist', 'vue.global.prod.js');
if (!fs.existsSync(vuePath)) {
  console.error(__('client.vueNotFound'));
  process.exit(1);
}
const vueJs = fs.readFileSync(vuePath, 'utf-8');

const markedPath = path.join(__dirname, 'node_modules', 'marked', 'lib', 'marked.umd.js');
if (!fs.existsSync(markedPath)) {
  console.warn(`  ${__('client.vueNotFound')} (marked)`);
}
const markedJs = fs.existsSync(markedPath) ? fs.readFileSync(markedPath, 'utf-8') : '';

let highlightJs = '';
const hljsCorePath = path.join(__dirname, 'node_modules', 'highlight.js', 'lib', 'core.js');
if (fs.existsSync(hljsCorePath)) {
  console.log(`  ${__('client.bundlingHighlight') || 'Bundling highlight.js...'}`);
  try {
    const result = esbuild.buildSync({
      entryPoints: [path.join(__dirname, 'node_modules', 'highlight.js', 'lib', 'common.js')],
      bundle: true,
      minify: false,
      write: false,
      format: 'iife',
      globalName: 'hljs',
      target: 'es2015',
    });
    highlightJs = result.outputFiles[0].text;
    console.log(`  ${__('client.highlightBundled') || 'highlight.js bundled'} (${(Buffer.byteLength(highlightJs, 'utf-8') / 1000).toFixed(1)} KB)`);
  } catch (e) {
    console.warn(`  ${__('client.highlightBundleFailed') || 'highlight.js bundle failed'}: ${e.message}`);
  }
} else {
  console.warn(`  ${__('client.vueNotFound')} (highlight.js)`);
}

console.log(`  ${__('client.compilingStylus')}`);

const themeLightPath = path.join(themeDir, 'source', 'css', '_theme', 'light.styl');
const themeDarkPath = path.join(themeDir, 'source', 'css', '_theme', 'dark.styl');
const mainStylPath = path.join(themeDir, 'source', 'css', 'style.styl');

let themeLightContent = '';
let themeDarkContent = '';
if (fs.existsSync(themeLightPath)) {
  themeLightContent = fs.readFileSync(themeLightPath, 'utf-8');
}
if (fs.existsSync(themeDarkPath)) {
  themeDarkContent = fs.readFileSync(themeDarkPath, 'utf-8');
}

const mainStylContent = fs.readFileSync(mainStylPath, 'utf-8');
const combinedStyl = themeLightContent + '\n' + themeDarkContent + '\n' + mainStylContent;

const cssContent = stylus.render(combinedStyl, { filename: mainStylPath });

let fontAwesomeCss = '';
const faCssPath = path.join(themeDir, 'source', 'assets', 'fontawesome', 'css', 'fontawesome.css');
const faSolidCssPath = path.join(themeDir, 'source', 'assets', 'fontawesome', 'css', 'solid.css');
const faRegularCssPath = path.join(themeDir, 'source', 'assets', 'fontawesome', 'css', 'regular.css');
const faBrandsCssPath = path.join(themeDir, 'source', 'assets', 'fontawesome', 'css', 'brands.css');
const faWebfontsDir = path.join(themeDir, 'source', 'assets', 'fontawesome', 'webfonts');

if (fs.existsSync(faCssPath)) {
  let faBase = fs.readFileSync(faCssPath, 'utf-8');
  faBase = faBase.replace(/url\(\.\.\/webfonts\//g, 'url(webfonts/');
  fontAwesomeCss += faBase + '\n';
}
if (fs.existsSync(faSolidCssPath)) {
  let faSolid = fs.readFileSync(faSolidCssPath, 'utf-8');
  faSolid = faSolid.replace(/url\(\.\.\/webfonts\//g, 'url(webfonts/');
  fontAwesomeCss += faSolid + '\n';
}
if (fs.existsSync(faRegularCssPath)) {
  let faRegular = fs.readFileSync(faRegularCssPath, 'utf-8');
  faRegular = faRegular.replace(/url\(\.\.\/webfonts\//g, 'url(webfonts/');
  fontAwesomeCss += faRegular + '\n';
}
if (fs.existsSync(faBrandsCssPath)) {
  let faBrands = fs.readFileSync(faBrandsCssPath, 'utf-8');
  faBrands = faBrands.replace(/url\(\.\.\/webfonts\//g, 'url(webfonts/');
  fontAwesomeCss += faBrands + '\n';
}
const faSize = fontAwesomeCss ? (Buffer.byteLength(fontAwesomeCss, 'utf-8') / 1000).toFixed(1) : '0';

// 处理自定义字体文件
let customFontCss = '';
const fontConfig = siteConfig.font || {};
const fontFiles = fontConfig.files || [];
const fontFamilies = [];

if (fontFiles.length > 0) {
  console.log(`  ${__('client.processingCustomFonts') || 'Processing custom fonts...'}`);
  const fontsDir = path.join(__dirname, 'source');
  const destFontsDir = path.join(outputDir, 'fonts');
  
  fontFiles.forEach((fontEntry, index) => {
    const fontPath = fontEntry.path || fontEntry;
    const fontWeight = fontEntry.weight || 'normal';
    const fontStyle = fontEntry.style || 'normal';
    const fontNameEntry = fontEntry.name || '';
    
    const fullFontPath = path.resolve(fontsDir, fontPath.replace(/^\.\//, ''));
    if (fs.existsSync(fullFontPath)) {
      const fontName = path.basename(fullFontPath);
      const fontExt = path.extname(fontName).toLowerCase();
      const fontFormatMap = {
        '.woff2': 'woff2',
        '.woff': 'woff',
        '.ttf': 'truetype',
        '.otf': 'opentype',
        '.eot': 'embedded-opentype',
      };
      const format = fontFormatMap[fontExt] || fontExt.replace('.', '');
      
      // 复制字体文件到输出目录
      if (!fs.existsSync(destFontsDir)) {
        fs.mkdirSync(destFontsDir, { recursive: true });
      }
      fs.copyFileSync(fullFontPath, path.join(destFontsDir, fontName));
      
      // 使用用户指定的字体名，或从文件名提取
      const familyName = fontNameEntry || fontConfig.family || 'CustomFont';
      if (!fontFamilies.includes(familyName)) {
        fontFamilies.push(familyName);
      }
      
      // 生成 @font-face 声明（含多格式回退以兼容 IE 等旧浏览器）
      const baseFontName = fontName.replace(fontExt, '');
      const altFormats = [];
      const altExts = fontExt === '.woff2' ? ['.woff', '.ttf', '.eot'] : fontExt === '.woff' ? ['.ttf', '.eot'] : [];
      for (const altExt of altExts) {
        const altName = baseFontName + altExt;
        const altPath = path.resolve(fontsDir, altName);
        if (fs.existsSync(altPath)) {
          if (!fs.existsSync(destFontsDir)) fs.mkdirSync(destFontsDir, { recursive: true });
          fs.copyFileSync(altPath, path.join(destFontsDir, altName));
          altFormats.push(`url('fonts/${altName}') format('${fontFormatMap[altExt] || altExt.replace('.', '')}')`);
        }
      }
      
      const srcList = [`url('fonts/${fontName}') format('${format}')`, ...altFormats].join(',\n       ');
      
      customFontCss += `
@font-face {
  font-family: '${familyName}';
  src: ${srcList};
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: swap;
}
`;
      console.log(`    ${__('client.fontLoaded') || 'Font loaded'}: ${fontName} (${format}, ${fontWeight}, ${fontStyle})${altFormats.length > 0 ? ' + ' + altFormats.length + ' fallback(s)' : ''}`);
    } else {
      console.warn(`    ${__('client.fontNotFound') || 'Font not found'}: ${fullFontPath}`);
    }
  });
  
  // 如果配置了 fontFamily，添加到 CSS
  if (fontConfig.family && fontFamilies.length > 0) {
    const fontFamilyList = fontFamilies.map(f => `'${f}'`).join(', ');
    customFontCss += `
html, body, button, input, select, textarea, .markdown-body, .preview-content, .announcement-body, .notification-body, .readme-box, .modal-content, .settings-panel, .file-card, pre, code {
  font-family: ${fontFamilyList}, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
}
`;
    console.log(`    ${__('client.fontFamilyApplied') || 'Font family applied'}: ${fontConfig.family}`);
  }
}

console.log(`  ${__('client.compilingPug')}`);

const layoutDir = path.join(themeDir, 'layout');
function compilePug(templatePath) {
  const template = fs.readFileSync(templatePath, 'utf-8');
  return pug.render(template, {
    filename: templatePath,
    pretty: false,
  });
}

const indexHtml = compilePug(path.join(layoutDir, 'index.pug'));
const page404Html = compilePug(path.join(layoutDir, '404.pug'));

const sourceDir = path.join(themeDir, 'source');
const jsDir = path.join(sourceDir, 'js');
const langDir = path.join(themeDir, 'languages');
const pluginDir = path.join(sourceDir, 'plugin');

const i18nZhCN = 'const I18N_ZH_CN = ' + fs.readFileSync(path.join(langDir, 'zh-CN.json'), 'utf-8') + ';';
const i18nZhTW = 'const I18N_ZH_TW = ' + fs.readFileSync(path.join(langDir, 'zh-TW.json'), 'utf-8') + ';';
const i18nEn = 'const I18N_EN = ' + fs.readFileSync(path.join(langDir, 'en.json'), 'utf-8') + ';';
const i18nJa = 'const I18N_JA = ' + fs.readFileSync(path.join(langDir, 'ja.json'), 'utf-8') + ';';
const i18nKo = 'const I18N_KO = ' + fs.readFileSync(path.join(langDir, 'ko.json'), 'utf-8') + ';';
const pluginRegistry = fs.readFileSync(path.join(pluginDir, 'registry.js'), 'utf-8');
const downloaderJs = fs.readFileSync(path.join(jsDir, 'downloader.js'), 'utf-8');
const hashVerifierJs = fs.readFileSync(path.join(jsDir, 'hashVerifier.js'), 'utf-8');
const apiJs = fs.readFileSync(path.join(jsDir, 'api.js'), 'utf-8');
const appJs = fs.readFileSync(path.join(jsDir, 'app.js'), 'utf-8');

let pluginCode = '';
if (siteConfig.plugins && siteConfig.plugins.length > 0) {
  console.log(`  ${__('client.loadingPlugins')}`);
  siteConfig.plugins.forEach(pluginName => {
    const pluginJsPath = path.join(pluginDir, pluginName, 'plugin.js');
    if (fs.existsSync(pluginJsPath)) {
      const code = fs.readFileSync(pluginJsPath, 'utf-8');
      pluginCode += `\n${code}\n`;
      console.log(`    ${__('client.pluginFound')} ${pluginName}`);
    } else {
      console.warn(`    ${__('client.pluginNotFound')} ${pluginName} — ${__('client.pluginJsNotFound')}`);
    }
  });
}

const configInjection = `
const APP_CONFIG = {
  title: ${JSON.stringify(siteConfig.title)},
  subtitle: ${JSON.stringify(siteConfig.subtitle)},
  manifestUrl: ${JSON.stringify(process.env.MANIFEST_URL || siteConfig.manifestUrl)},
  localFallback: ${JSON.stringify(siteConfig.localFallback || '')},
  downloadThreads: ${siteConfig.downloadThreads},
  defaultLang: ${JSON.stringify(siteConfig.language)},
  defaultTheme: ${JSON.stringify(siteConfig.defaultTheme)},
  theme: ${JSON.stringify(themeName)},
  chunkExtension: ${JSON.stringify(siteConfig.chunkExtension || 'rbpan')},
  backdropBlur: ${siteConfig.backdropBlur || 8},
  accentColor: ${JSON.stringify(siteConfig.accentColor || '')},
  preset: ${JSON.stringify(siteConfig.preset || 'glass')},
  bgImage: ${JSON.stringify(siteConfig.bgImage || '')},
  fontFamily: ${JSON.stringify(fontConfig.family || '')},
  beautify: ${siteConfig.beautify !== false},
  minify: ${siteConfig.minify !== false},
  footerText: ${JSON.stringify(siteConfig.footerText || '')},
  footerUrl: ${JSON.stringify(siteConfig.footerUrl || '')},
};
`;

const combinedJs =
  configInjection + '\n' +
  pluginRegistry + '\n' +
  pluginCode + '\n' +
  i18nZhCN + '\n' +
  i18nZhTW + '\n' +
  i18nEn + '\n' +
  i18nJa + '\n' +
  i18nKo + '\n' +
  markedJs + '\n' +
  highlightJs + '\n' +
  downloaderJs + '\n' +
  hashVerifierJs + '\n' +
  apiJs + '\n' +
  appJs;

let minifiedJs = combinedJs;
if (siteConfig.minify !== false) {
  console.log(`  ${__('client.minifyingJs') || 'Minifying JS...'}`);
  try {
    const result = esbuild.transformSync(combinedJs, {
      minify: true,
      minifyWhitespace: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      target: 'es2015',
      keepNames: true,
    });
    minifiedJs = result.code;
    const ratio = ((1 - minifiedJs.length / combinedJs.length) * 100).toFixed(0);
    console.log(`  ${__('client.jsMinified') || 'JS minified'} (${(Buffer.byteLength(minifiedJs, 'utf-8') / 1000).toFixed(1)} KB, -${ratio}%)`);
  } catch (e) {
    console.warn(`  ${__('client.jsMinifyFailed') || 'JS minify failed'}: ${e.message}`);
  }
}

const externalLibs = [
  '<script src="https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js" defer></script>',
  '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" defer></script>',
].join('\n');

const customCssTags = (siteConfig.customCss || [])
  .map(url => `<link rel="stylesheet" href="${url}">`)
  .join('\n');
const customJsTags = (siteConfig.customJs || [])
  .map(url => `<script src="${url}" defer></script>`)
  .join('\n');
const customHead = siteConfig.customHead || '';
const customBody = siteConfig.customBody || '';

const faviconUrl = siteConfig.favicon || 'favicon.ico';
const faviconTag = /^https?:\/\//.test(faviconUrl)
  ? `<link rel="icon" href="${faviconUrl}">`
  : `<link rel="icon" href="${faviconUrl}">`;

const beautifyClass = siteConfig.beautify !== false ? 'beautify-enabled' : '';

let ieCss = '';
let iePolyfill = '';

if (ieCompat) {
  console.log(`  ${__('client.generatingIeCompat') || 'Generating IE compatibility layer...'}`);

  const ieFallbackVars = {
    '--accent': '#6366f1',
    '--accent-via': '#8b5cf6',
    '--accent-soft': 'rgba(99,102,241,0.08)',
    '--accent-hover': '#4f46e5',
    '--accent-glow': 'rgba(99,102,241,0.25)',
    '--bg': '#f0f2f5',
    '--surface': 'rgba(255,255,255,0.95)',
    '--surface-strong': 'rgba(255,255,255,1)',
    '--surface-weak': 'rgba(241,245,249,0.9)',
    '--surface-hover': 'rgba(255,255,255,0.98)',
    '--text': '#1a1a2e',
    '--text-secondary': '#5a6078',
    '--text-muted': '#8b90a5',
    '--border': 'rgba(200,205,220,0.6)',
    '--border-rgb': '200, 205, 220',
    '--border-strong': 'rgba(180,185,200,0.8)',
    '--shadow-sm': '0 2px 8px rgba(0,0,0,0.06)',
    '--shadow': '0 4px 16px rgba(0,0,0,0.08)',
    '--shadow-md': '0 8px 24px rgba(0,0,0,0.1)',
    '--shadow-lg': '0 16px 40px rgba(0,0,0,0.14)',
    '--folder': '#f59e0b',
    '--folder-bg': 'rgba(245,158,11,0.1)',
    '--folder-hover-bg': 'rgba(245,158,11,0.16)',
    '--file-bg': 'rgba(241,245,249,0.5)',
    '--file-hover': 'rgba(248,250,252,0.7)',
    '--folder-hover': 'rgba(99,102,241,0.06)',
    '--progress-bg': 'rgba(226,232,240,0.5)',
    '--radius': '16px',
    '--radius-sm': '10px',
    '--radius-lg': '20px',
    '--radius-xl': '28px',
    '--transition': '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '--glass-blur': '0px',
    '--glass-saturate': '100%',
    '--bar-bg': 'rgba(255,255,255,0.95)',
    '--bar-blur': '0px',
    '--bar-item-bg': 'rgba(241,245,249,0.8)',
    '--bar-item-border': 'rgba(200,205,220,0.5)',
    '--bar-item-hover': 'rgba(241,245,249,0.95)',
    '--bar-text': '#1a1a2e',
    '--bar-text-sub': '#5a6078',
    '--bar-border': '1px solid rgba(200,205,220,0.5)',
    '--lang-btn-size': '2.375rem',
    '--lang-btn-font-size': '0.875rem',
    '--lang-btn-font-weight': '400',
    '--lang-dropdown-min-width': '11.25rem',
    '--lang-item-padding': '0.6875rem 1rem',
    '--loader-bg': '#f0f2f5',
    '--loader-logo-bg': 'rgba(99,102,241,0.15)',
    '--loader-logo-color': '#6366f1',
    '--loader-title-color': '#1a1a2e',
    '--loader-bar-bg': 'rgba(99,102,241,0.15)',
    '--loader-bar-fill': '#6366f1',
    '--loader-text-color': '#5a6078',
  };

  let combinedCss = cssContent + '\n' + (customFontCss || '') + '\n' + (fontAwesomeCss || '');
  ieCss = combinedCss;

  for (const [varName, fallback] of Object.entries(ieFallbackVars)) {
    const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    ieCss = ieCss.replace(new RegExp('var\\(' + escaped + '([^)]*)\\)', 'g'), fallback);
    ieCss = ieCss.replace(new RegExp('var\\(' + escaped + ',([^)]*)\\)', 'g'), fallback);
  }

  ieCss = ieCss.replace(/var\(--[^)]+\)/g, 'initial');
  ieCss = ieCss.replace(/var\(--[^,)]+,[^)]*\)/g, (match) => {
    const commaIdx = match.indexOf(',');
    const fallbackVal = match.substring(commaIdx + 1, match.length - 1).trim();
    return fallbackVal;
  });

  ieCss = ieCss.replace(/backdrop-filter:\s*[^;!]+[;!]/gi, '');
  ieCss = ieCss.replace(/-webkit-backdrop-filter:\s*[^;!]+[;!]/gi, '');

  ieCss = ieCss.replace(/inset\s+0/g, 'top:0;left:0;right:0;bottom:0');

  ieCss = ieCss.replace(/scroll-behavior:\s*smooth[;!]/gi, '');

  if (siteConfig.minify !== false) {
    ieCss = ieCss
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;\}/g, '}')
      .trim();
  }

  iePolyfill = `
(function(){
  if(typeof Promise==='undefined'||typeof fetch==='undefined'||typeof Array.from==='undefined'){
    var d=document;
    var s=d.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js';
    d.head.appendChild(s);
    var s2=d.createElement('script');
    s2.src='https://cdn.jsdelivr.net/npm/whatwg-fetch@3/dist/fetch.umd.js';
    d.head.appendChild(s2);
  }
  if(!String.prototype.startsWith){
    String.prototype.startsWith=function(s,p){p=p||0;return this.indexOf(s,p)===p;};
  }
  if(!String.prototype.endsWith){
    String.prototype.endsWith=function(s,p){var l=(p===undefined?this.length:p)-s.length;return this.indexOf(s,l)===l;};
  }
  if(!String.prototype.includes){
    String.prototype.includes=function(s,p){return this.indexOf(s,p)!==-1;};
  }
  if(!Array.prototype.find){
    Array.prototype.find=function(fn){for(var i=0;i<this.length;i++){if(fn(this[i],i,this))return this[i];}};
  }
  if(!Array.prototype.findIndex){
    Array.prototype.findIndex=function(fn){for(var i=0;i<this.length;i++){if(fn(this[i],i,this))return i;}return -1;};
  }
  if(!Array.from){
    Array.from=function(a,fn,ctx){var r=[];if(typeof a==='string'||a instanceof String){for(var i=0;i<a.length;i++){r.push(fn?fn.call(ctx,a[i],i):a[i]);}}else{for(var i=0;i<a.length;i++){r.push(fn?fn.call(ctx,a[i],i):a[i]);}}return r;};
  }
  if(!Object.assign){
    Object.assign=function(t){for(var i=1;i<arguments.length;i++){var s=arguments[i];if(s){for(var k in s){if(Object.prototype.hasOwnProperty.call(s,k))t[k]=s[k];}}}return t;};
  }
  if(!Element.prototype.closest){
    Element.prototype.closest=function(s){var e=this;do{if(e.matches(s))return e;e=e.parentElement||e.parentNode;}while(e!==null&&e.nodeType===1);return null;};
  }
  if(!Number.isNaN){Number.isNaN=function(v){return v!==v;};}
  if(!Number.isFinite){Number.isFinite=function(v){return typeof v==='number'&&isFinite(v);};}
  if(!String.prototype.repeat){
    String.prototype.repeat=function(n){var r='';for(var i=0;i<n;i++)r+=this;return r;};
  }
  if(!String.prototype.padStart){
    String.prototype.padStart=function(l,s){var p=s||' ';var r=this;while(r.length<l)r=p+r;return r;};
  }
  if(!String.prototype.padEnd){
    String.prototype.padEnd=function(l,s){var p=s||' ';var r=this;while(r.length<l)r=r+p;return r;};
  }
  if(!window.crypto||!window.crypto.subtle){
    window.crypto=window.crypto||{};
    window.crypto.subtle=window.crypto.subtle||{};
  }
  if(!window.ReadableStream){
    window.ReadableStream=function(){};
  }
  if(!window.AbortController){
    window.AbortController=function(){this.signal={aborted:false};};
    window.AbortController.prototype.abort=function(){this.signal.aborted=true;};
  }
})();
`;

  console.log(`  ${__('client.ieCompatDone') || 'IE compatibility layer generated'} (CSS ${(Buffer.byteLength(ieCss, 'utf-8') / 1000).toFixed(1)} KB, polyfill ${(Buffer.byteLength(iePolyfill, 'utf-8') / 1000).toFixed(1)} KB)`);
}

function minifyCss(css) {
  if (siteConfig.minify === false) return css;
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .trim();
}

function minifyHtml(html) {
  if (siteConfig.minify === false) return html;
  return html
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildHtml(htmlContent) {
  let ieConditional = '';
  if (ieCompat) {
    ieConditional = '<!--[if IE]>\n' +
      '<style>\n' + ieCss + '\n</style>\n' +
      '<script>\n' + iePolyfill + '\n</script>\n' +
      '<![endif]-->';
  }

  let result = htmlContent
    .replace('BEAUTIFY_CLASS', beautifyClass)
    .replace('<!-- FAVICON_PLACEHOLDER -->', faviconTag)
    .replace('<!-- CSS_PLACEHOLDER -->', `<style>\n${minifyCss(cssContent)}\n${customFontCss ? minifyCss(customFontCss) : ''}\n</style>`)
    .replace('<!-- FA_CSS_PLACEHOLDER -->', fontAwesomeCss ? `<style>\n${minifyCss(fontAwesomeCss)}\n</style>` : '')
    .replace('<!-- CUSTOM_HEAD_PLACEHOLDER -->', customHead + '\n' + customCssTags + '\n' + externalLibs + '\n' + ieConditional)
    .replace('<!-- CUSTOM_BODY_PLACEHOLDER -->', customBody + '\n' + customJsTags)
    .replace('<!-- VUE_PLACEHOLDER -->', () => `<script>\n${vueJs}\n</script>`)
    .replace('<!-- JS_PLACEHOLDER -->', () => `<script>\n${minifiedJs}\n</script>`);
  return minifyHtml(result);
}

const finalIndexHtml = buildHtml(indexHtml);
const indexPath = path.join(outputDir, 'index.html');
fs.writeFileSync(indexPath, finalIndexHtml, 'utf-8');
const indexSize = (Buffer.byteLength(finalIndexHtml, 'utf-8') / 1000).toFixed(1);

const final404Html = page404Html
  .replace('BEAUTIFY_CLASS', beautifyClass)
  .replace('<!-- FAVICON_PLACEHOLDER -->', faviconTag)
  .replace('<!-- CSS_PLACEHOLDER -->', `<style>\n${minifyCss(cssContent)}\n</style>`)
  .replace('<!-- FA_CSS_PLACEHOLDER -->', fontAwesomeCss ? `<style>\n${minifyCss(fontAwesomeCss)}\n</style>` : '')
  .replace('<!-- CUSTOM_HEAD_PLACEHOLDER -->', customHead + '\n' + customCssTags + '\n' + (ieCompat ? '<!--[if IE]>\n<style>\n' + ieCss + '\n</style>\n<script>\n' + iePolyfill + '\n</script>\n<![endif]-->' : ''))
  .replace('<!-- CUSTOM_BODY_PLACEHOLDER -->', customBody + '\n' + customJsTags)
  .replace('<!-- VUE_PLACEHOLDER -->', '')
  .replace('<!-- JS_PLACEHOLDER -->', '');
const page404Path = path.join(outputDir, '404.html');
fs.writeFileSync(page404Path, final404Html, 'utf-8');
const page404Size = (Buffer.byteLength(final404Html, 'utf-8') / 1000).toFixed(1);

fs.writeFileSync(path.join(outputDir, '_headers'), '/*\n  Access-Control-Allow-Origin: *\n', 'utf-8');
fs.writeFileSync(path.join(outputDir, '_redirects'), '/* /index.html 200\n', 'utf-8');

const swJsPath = path.join(sourceDir, 'sw.js');
if (fs.existsSync(swJsPath)) {
  fs.copyFileSync(swJsPath, path.join(outputDir, 'sw.js'));
  console.log(`  sw.js ${__('client.sourceCopied') || '已复制到输出目录'}`);
}

fs.writeFileSync(path.join(outputDir, 'api.js'), apiJs, 'utf-8');
console.log(`  ${__('client.apiBuilt') || 'api.js 已生成'}`);

if (fontAwesomeCss && fs.existsSync(faWebfontsDir)) {
  const destWebfontsDir = path.join(outputDir, 'webfonts');
  fs.mkdirSync(destWebfontsDir, { recursive: true });
  const fontFiles = fs.readdirSync(faWebfontsDir);
  for (const f of fontFiles) {
    fs.copyFileSync(path.join(faWebfontsDir, f), path.join(destWebfontsDir, f));
  }
  console.log(`  ${__('client.fontAwesomeBuilt') || 'FontAwesome 集成完成'} (CSS ${faSize} KB, ${fontFiles.length} webfonts)`);
}

console.log(`\n${__('client.buildComplete')}`);
console.log(`\n  ${__('client.outputDir')}:  ${outputDir}`);
console.log(`  ${__('client.indexHtml')}:  ${indexSize} KB`);
console.log(`  ${__('client.page404')}:    ${page404Size} KB`);
console.log(`\n  ${__('client.theme')}:       ${themeName} (${siteConfig.defaultTheme})`);
console.log(`  ${__('client.plugins')}:     ${siteConfig.plugins?.length || 0} ${__('client.pluginsLoaded')}`);
console.log(`\n  ${__('client.config')}: ${path.resolve(__dirname, '_config.yml')}`);
console.log(`  ${__('client.configHint')}`);
console.log(`\n  ${__('client.deployment')}:`);
console.log(`    ${__('client.deployCloudflare')}`);
console.log(`    ${__('client.deployStatic')}\n`);