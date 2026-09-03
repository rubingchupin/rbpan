const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const pug = require('pug');
const stylus = require('stylus');
const esbuild = require('esbuild');

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
      
      // 生成 @font-face 声明
      customFontCss += `
@font-face {
  font-family: '${familyName}';
  src: url('fonts/${fontName}') format('${format}');
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: swap;
}
`;
      console.log(`    ${__('client.fontLoaded') || 'Font loaded'}: ${fontName} (${format}, ${fontWeight}, ${fontStyle})`);
    } else {
      console.warn(`    ${__('client.fontNotFound') || 'Font not found'}: ${fullFontPath}`);
    }
  });
  
  // 如果配置了 fontFamily，添加到 CSS
  if (fontConfig.family && fontFamilies.length > 0) {
    const fontFamilyList = fontFamilies.map(f => `'${f}'`).join(', ');
    customFontCss += `
body {
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
const rbpanLinkJs = fs.readFileSync(path.join(jsDir, 'rbpan-link.js'), 'utf-8');
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
  rbpanLinkJs + '\n' +
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
      keepNames: false,
      mangleProps: /^_/,
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
  let result = htmlContent
    .replace('BEAUTIFY_CLASS', beautifyClass)
    .replace('<!-- FAVICON_PLACEHOLDER -->', faviconTag)
    .replace('<!-- CSS_PLACEHOLDER -->', `<style>\n${minifyCss(cssContent)}\n${customFontCss ? minifyCss(customFontCss) : ''}\n</style>`)
    .replace('<!-- FA_CSS_PLACEHOLDER -->', fontAwesomeCss ? `<style>\n${minifyCss(fontAwesomeCss)}\n</style>` : '')
    .replace('<!-- CUSTOM_HEAD_PLACEHOLDER -->', customHead + '\n' + customCssTags + '\n' + externalLibs)
    .replace('<!-- CUSTOM_BODY_PLACEHOLDER -->', customBody + '\n' + customJsTags)
    .replace('<!-- VUE_PLACEHOLDER -->', `<script>\n${vueJs}\n</script>`)
    .replace('<!-- JS_PLACEHOLDER -->', `<script>\n${minifiedJs}\n</script>`);
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
  .replace('<!-- CUSTOM_HEAD_PLACEHOLDER -->', customHead + '\n' + customCssTags)
  .replace('<!-- CUSTOM_BODY_PLACEHOLDER -->', customBody + '\n' + customJsTags)
  .replace('<!-- VUE_PLACEHOLDER -->', '')
  .replace('<!-- JS_PLACEHOLDER -->', '');
const page404Path = path.join(outputDir, '404.html');
fs.writeFileSync(page404Path, final404Html, 'utf-8');
const page404Size = (Buffer.byteLength(final404Html, 'utf-8') / 1000).toFixed(1);

fs.writeFileSync(path.join(outputDir, '_headers'), '/*\n  Access-Control-Allow-Origin: *\n', 'utf-8');
fs.writeFileSync(path.join(outputDir, '_redirects'), '/* /index.html 200\n', 'utf-8');

fs.writeFileSync(path.join(outputDir, 'rbpan-link.js'), rbpanLinkJs, 'utf-8');
console.log(`  ${__('client.rbpanLinkBuilt')}`);

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