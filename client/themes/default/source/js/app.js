const { createApp } = Vue;

function safeStorage() {
  try {
    const key = '__rbpan_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return localStorage;
  } catch (e) {
    const store = {};
    return {
      getItem: function(k) { return store[k] || null; },
      setItem: function(k, v) { store[k] = String(v); },
      removeItem: function(k) { delete store[k]; },
    };
  }
}

const storage = safeStorage();

marked.setOptions({
  gfm: true,
  breaks: true,
});

const PREVIEW_MD_EXTS = ['md', 'markdown', 'mdown', 'mkd', 'mdwn', 'mdtext'];
const PREVIEW_TEXT_EXTS = ['txt', 'log', 'csv', 'rst', 'tex', 'org', 'rtf', 'text', 'readme', 'license', 'changelog'];
const PREVIEW_CODE_EXTS = ['js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'css', 'scss', 'sass', 'less', 'styl', 'html', 'htm', 'xhtml', 'json', 'jsonc', 'json5', 'xml', 'svg', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf', 'properties', 'env', 'gitignore', 'npmrc', 'editorconfig', 'py', 'pyw', 'pyx', 'rb', 'erb', 'go', 'rs', 'java', 'kt', 'kts', 'scala', 'c', 'cpp', 'cxx', 'h', 'hpp', 'hxx', 'cs', 'swift', 'm', 'mm', 'sh', 'bash', 'zsh', 'fish', 'bat', 'cmd', 'ps1', 'psm1', 'php', 'sql', 'r', 'lua', 'pl', 'pm', 'dart', 'vue', 'svelte', 'astro', 'dockerfile', 'makefile', 'cmake', 'gradle', 'groovy', 'clj', 'cljs', 'elm', 'erl', 'ex', 'exs', 'fs', 'fsx', 'hs', 'lhs', 'nim', 'nix', 'ml', 'mli', 'jl', 'zig', 'v', 'coffee', 'litcoffee'];
const PREVIEW_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'avif', 'tiff', 'tif', 'apng', 'jfif', 'pjpeg', 'pjp'];
const PREVIEW_AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus', 'weba', 'wma', 'aiff', 'aif'];
const PREVIEW_VIDEO_EXTS = ['mp4', 'webm', 'ogv', 'mov', 'avi', 'mkv', 'm4v', 'mpg', 'mpeg', 'wmv', 'flv', '3gp'];
const PREVIEW_PDF_EXTS = ['pdf'];
const PREVIEW_HTML_EXTS = ['html', 'htm', 'xhtml'];
const PREVIEW_DOCX_EXTS = ['docx'];
const PREVIEW_XLSX_EXTS = ['xlsx', 'xls'];
const PREVIEW_PPTX_EXTS = ['pptx'];

const PREVIEWABLE_EXTS = new Set([
  ...PREVIEW_MD_EXTS, ...PREVIEW_TEXT_EXTS, ...PREVIEW_CODE_EXTS,
  ...PREVIEW_IMAGE_EXTS, ...PREVIEW_AUDIO_EXTS, ...PREVIEW_VIDEO_EXTS,
  ...PREVIEW_PDF_EXTS, ...PREVIEW_HTML_EXTS, ...PREVIEW_DOCX_EXTS,
  ...PREVIEW_XLSX_EXTS, ...PREVIEW_PPTX_EXTS,
]);

const ICON_MD_EXTS = new Set(PREVIEW_MD_EXTS);
const ICON_CODE_EXTS = new Set(PREVIEW_CODE_EXTS);
const ICON_IMAGE_EXTS = new Set(PREVIEW_IMAGE_EXTS);
const ICON_AUDIO_EXTS = new Set(PREVIEW_AUDIO_EXTS);
const ICON_VIDEO_EXTS = new Set(PREVIEW_VIDEO_EXTS);
const ICON_PDF_EXTS = new Set(PREVIEW_PDF_EXTS);

const EXT_LANG_MAP = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
  css: 'css', scss: 'scss', sass: 'scss', less: 'less', styl: 'stylus',
  html: 'xml', htm: 'xml', xhtml: 'xml',
  json: 'json', jsonc: 'json', json5: 'json',
  xml: 'xml', svg: 'xml',
  yml: 'yaml', yaml: 'yaml',
  toml: 'ini', ini: 'ini', cfg: 'ini', conf: 'ini', properties: 'ini',
  env: 'bash', gitignore: 'bash', npmrc: 'ini', editorconfig: 'ini',
  py: 'python', pyw: 'python', pyx: 'python',
  rb: 'ruby', erb: 'ruby',
  go: 'go', rs: 'rust',
  java: 'java', kt: 'kotlin', kts: 'kotlin', scala: 'scala',
  c: 'c', cpp: 'cpp', cxx: 'cpp', h: 'c', hpp: 'cpp', hxx: 'cpp',
  cs: 'csharp', swift: 'swift', m: 'objectivec', mm: 'objectivec',
  sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
  bat: 'dos', cmd: 'dos', ps1: 'powershell', psm1: 'powershell',
  php: 'php', sql: 'sql', r: 'r', lua: 'lua', pl: 'perl', pm: 'perl',
  dart: 'dart', vue: 'xml', svelte: 'xml', astro: 'xml',
  dockerfile: 'dockerfile', makefile: 'makefile',
  cmake: 'cmake', gradle: 'groovy', groovy: 'groovy',
  clj: 'clojure', cljs: 'clojure',
  elm: 'elm', erl: 'erlang', ex: 'elixir', exs: 'elixir',
  fs: 'fsharp', fsx: 'fsharp',
  hs: 'haskell', lhs: 'haskell',
  nim: 'nim', nix: 'nix',
  ml: 'ocaml', mli: 'ocaml',
  jl: 'julia', zig: 'zig', v: 'v',
  coffee: 'coffeescript', litcoffee: 'coffeescript',
};

function highlightCode(code, ext) {
  if (typeof hljs === 'undefined') return code;
  const lang = EXT_LANG_MAP[ext];
  if (lang && hljs.getLanguage(lang)) {
    try {
      const result = hljs.highlight(code, { language: lang });
      return result.value;
    } catch (e) {
      console.error('highlight error:', e);
    }
  }
  try {
    const result = hljs.highlightAuto(code);
    return result.value;
  } catch (e) {
    console.error('highlightAuto error:', e);
  }
  return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const app = createApp({
  data() {
    return {
      manifest: null,
      manifestUrl: APP_CONFIG.manifestUrl || '',
      currentPath: '',
      loading: true,
      initialLoading: true,
      isInitialLoad: true,
      pageReady: false,
      error: false,
      errorMsg: '',
      searchQuery: '',
      debouncedSearchQuery: '',
      searchTimer: null,
      viewMode: 'list',
      currentTheme: APP_CONFIG.defaultTheme || 'light',
      currentLang: APP_CONFIG.defaultLang || 'zh-CN',
      t: {},

      readmeContent: '',
      readmeLoading: false,

      announcementContent: '',
      announcementVisible: false,
      announcementHash: '',
      announcementDontShowAgain: false,

      notificationContent: '',
      notificationVisible: false,
      notificationClosing: false,
      notificationTimer: null,

      previewModal: false,
      previewFileName: '',
      previewContent: '',
      previewLoading: false,
      previewType: '',
      previewRawUrl: '',

      downloadModal: false,
      downloadFileName: '',
      downloadProgress: 0,
      downloadSpeed: '',
      downloadDetail: '',
      downloadCancellable: true,
      downloadPaused: false,
      downloader: null,
      hashVerifier: null,
      currentDownloadCtrl: null,
      currentDownloadId: null,

      settingsOpen: false,
      langDropdownOpen: false,
      showFolderImage: false,
      showFileCount: true,
      showGalleryThumb: true,
      rememberLastImage: false,
      reducedMotion: false,
      totalFileCount: 0,
    };
  },

  computed: {
    currentFiles() {
      if (!this.manifest || !this.manifest.files) return [];
      const files = this.getFilesAtPath(this.currentPath);
      // 过滤掉 announcement.md 和 notification.md，它们有实际作用但不被列表显示
      return files.filter(f => {
        if (f.type === 'file') {
          const name = f.name.toLowerCase();
          return name !== 'announcement.md' && name !== 'notification.md';
        }
        return true;
      });
    },

    filteredFiles() {
      const q = this.debouncedSearchQuery.trim().toLowerCase();
      if (!q) return this.currentFiles;
      return this.currentFiles.filter(f =>
        f.name.toLowerCase().includes(q)
      );
    },

    breadcrumbItems() {
      const parts = this.currentPath.split('/').filter(Boolean);
      const items = [{ name: this.t.breadcrumb?.root || '根目录', path: '' }];
      let accum = '';
      for (const part of parts) {
        accum += (accum ? '/' : '') + part;
        items.push({ name: part, path: accum });
      }
      return items;
    },

    fileCountText() {
      if (!this.manifest) return '';
      const count = this.totalFileCount;
      return count + ' ' + (this.currentLang === 'zh-CN' || this.currentLang === 'zh-TW' ? '个文件' : ' files');
    },

    langLabel() {
      const labels = { 'zh-CN': '简', 'zh-TW': '繁', 'en': 'EN', 'ja': 'JA', 'ko': 'KO' };
      return labels[this.currentLang] || '简';
    },
  },

  watch: {
    searchQuery(val) {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.debouncedSearchQuery = val;
      }, 300);
    },
  },

  methods: {
    traverseAndTag(files) {
      let count = 0;
      for (const f of files) {
        f._icon = this.getFileIcon(f);
        f._ext = f.type === 'file' ? this.getFileExtension(f.name).toLowerCase() : '';
        if (f.type === 'file') {
          count++;
        } else if (f.children) {
          count += this.traverseAndTag(f.children);
        }
      }
      return count;
    },

    getFilesAtPath(targetPath) {
      if (!this.manifest.files) return [];
      if (!targetPath) return this.manifest.files;

      const parts = targetPath.split('/').filter(Boolean);
      let current = this.manifest.files;
      for (const part of parts) {
        const found = current.find(f => f.name === part);
        if (!found || found.type !== 'folder') return [];
        current = found.children || [];
      }
      return current;
    },

    navigateTo(path) {
      this.currentPath = path;
      this.searchQuery = '';
      this.updateUrl();
      this.loadReadme();
      RbpanPlugins.onNavigate(path);
    },

    enterFolder(file) {
      if (file.type !== 'folder') return;
      this.currentPath = file.path;
      this.searchQuery = '';
      this.updateUrl();
      this.loadReadme();
      RbpanPlugins.onNavigate(file.path);
    },

    getFileIcon(file) {
      if (file.type === 'folder') return 'folder';
      const ext = this.getFileExtension(file.name).toLowerCase();
      if (ICON_MD_EXTS.has(ext)) return 'file-md';
      if (ICON_CODE_EXTS.has(ext)) return 'file-code';
      if (ICON_IMAGE_EXTS.has(ext)) return 'file-img';
      if (ICON_AUDIO_EXTS.has(ext)) return 'file-audio';
      if (ICON_VIDEO_EXTS.has(ext)) return 'file-video';
      if (ICON_PDF_EXTS.has(ext)) return 'file-pdf';
      return 'file';
    },

    getFileExtension(name) {
      const i = name.lastIndexOf('.');
      return i > 0 ? name.slice(i + 1) : '';
    },

    isPreviewable(file) {
      if (file.type === 'folder') return false;
      const ext = file._ext || this.getFileExtension(file.name).toLowerCase();
      return PREVIEWABLE_EXTS.has(ext);
    },

    formatSize(bytes) {
      if (!bytes) return '0 B';
      if (bytes < 1000) return bytes + ' B';
      if (bytes < 1000000) return (bytes / 1000).toFixed(1) + ' KB';
      if (bytes < 1000000000) return (bytes / 1000000).toFixed(1) + ' MB';
      return (bytes / 1000000000).toFixed(2) + ' GB';
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + dd;
    },

    getChunkInfo(file) {
      if (!file.chunks || file.chunks <= 1) return '';
      const tpl = this.t.fileList?.chunks || '{n} chunks';
      return tpl.replace('{n}', file.chunks);
    },

    async loadManifest() {
      console.log('[rbpan] loadManifest called, manifestUrl:', this.manifestUrl);
      this.loading = true;
      this.error = false;
      this.errorMsg = '';

      const urls = [];
      if (APP_CONFIG.localFallback) {
        urls.push(APP_CONFIG.localFallback);
      }
      urls.push(this.manifestUrl);

      console.log('[rbpan] trying URLs:', urls);

      let lastErr = null;
      let retries = 5;
      let retryDelay = 500;

      for (let attempt = 0; attempt < retries; attempt++) {
        for (const url of urls) {
          try {
            console.log(`[rbpan] attempt ${attempt + 1}/${retries}, fetching: ${url}`);
            const response = await fetch(url + '?t=' + Date.now(), {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            console.log('[rbpan] manifest loaded successfully, files:', data?.files?.length || 0);
            this.manifest = data;
            this.totalFileCount = this.traverseAndTag(data.files || []);
            this.loading = false;
            if (!this.initFromUrl()) {
              this.loadReadme();
            }
            if (this.isInitialLoad) {
              this.isInitialLoad = false;
              console.log('[rbpan] initial load - loading announcement and notification...');
              this.loadAnnouncement();
              this.loadNotification();
            } else {
              console.log('[rbpan] manual refresh - skipping announcement');
              this.loadNotification();
            }
            this.finishInitialLoading();
            return;
          } catch (err) {
            lastErr = err;
            console.warn(`[rbpan] Manifest fetch failed for ${url} (attempt ${attempt + 1}/${retries}):`, err.message);
          }
        }
        if (attempt < retries - 1) {
          console.log(`[rbpan] retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 1.5;
        }
      }

      this.loading = false;
      this.error = true;
      this.finishInitialLoading();
      const hint = APP_CONFIG.localFallback
        ? (this.t.status?.manifestError || '无法连接数据源，请检查 manifest.json 地址或本地回退配置')
        : (this.t.status?.manifestError || '无法连接数据源，请在 _config.js 中配置 localFallback 作为本地回退');
      this.errorMsg = hint + '\n' + (lastErr ? lastErr.message : '');
      console.error('[rbpan] loadManifest failed:', this.errorMsg);
    },

    async readFileText(file) {
      const baseUrl = this.manifest.baseUrl || this.manifestUrl.replace(/\/manifest\.json$/, '');
      const chunkExtension = this.manifest.chunkExtension || 'rbpan';

      if (file.chunks > 1) {
        if (!this.downloader) {
          this.downloader = new ChunkDownloader();
        }
        const { blob } = await this.downloader.downloadFile(file, baseUrl, chunkExtension, 6, null);
        return await blob.text();
      }

      const url = baseUrl.replace(/\/+$/, '') + '/' + file.path;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return await resp.text();
    },

    async loadReadme() {
      this.readmeContent = '';
      this.readmeLoading = false;
      const files = this.currentFiles;
      if (!files) return;
      const readmeFile = files.find(f => f.type === 'file' && /^readme\.(md|markdown|mdown|mkd|mdwn|mdtext|txt|text)$/i.test(f.name));
      if (!readmeFile) return;

      this.readmeLoading = true;
      try {
        const text = await this.readFileText(readmeFile);
        const ext = this.getFileExtension(readmeFile.name).toLowerCase();
        if (PREVIEW_MD_EXTS.includes(ext)) {
          this.readmeContent = marked.parse(text);
        } else {
          this.readmeContent = '<pre>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
        }
      } catch (e) {
        console.error('README load error:', e);
      } finally {
        this.readmeLoading = false;
      }
    },

    async loadAnnouncement() {
      console.log('[rbpan] loadAnnouncement called');
      this.announcementContent = '';
      this.announcementVisible = false;
      this.announcementDontShowAgain = false;
      if (!this.manifest || !this.manifest.files) return;
      
      const files = this.getFilesAtPath(this.currentPath);
      const announcementFile = files.find(f => f.type === 'file' && /^announcement\.(md|markdown|mdown|mkd|mdwn|mdtext|txt|text)$/i.test(f.name));
      console.log('[rbpan] announcement file found:', !!announcementFile);
      if (!announcementFile) return;

      try {
        const text = await this.readFileText(announcementFile);
        
        // 计算内容hash，用于检测内容是否变化
        const currentHash = this.simpleHash(text);
        const savedHash = localStorage.getItem('rbpan-announcement-hash');
        const dontShowAgain = localStorage.getItem('rbpan-announcement-dontshow') === 'true';
        console.log('[rbpan] announcement hash - current:', currentHash, 'saved:', savedHash, 'dontShowAgain:', dontShowAgain);
        
        // 如果内容变化或用户未勾选不再显示，则显示
        if (currentHash !== savedHash || !dontShowAgain) {
          const ext = this.getFileExtension(announcementFile.name).toLowerCase();
          if (PREVIEW_MD_EXTS.includes(ext)) {
            this.announcementContent = marked.parse(text);
          } else {
            this.announcementContent = '<pre>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
          }
          this.announcementHash = currentHash;
          this.announcementVisible = true;
          console.log('[rbpan] announcement showing');
        }
      } catch (e) {
        console.error('Announcement load error:', e);
      }
    },

    async loadNotification() {
      console.log('[rbpan] loadNotification called');
      this.notificationContent = '';
      this.notificationVisible = false;
      if (this.notificationTimer) {
        clearTimeout(this.notificationTimer);
        this.notificationTimer = null;
      }
      
      if (!this.manifest || !this.manifest.files) return;
      const files = this.getFilesAtPath(this.currentPath);
      const notificationFile = files.find(f => f.type === 'file' && /^notification\.(md|markdown|mdown|mkd|mdwn|mdtext|txt|text)$/i.test(f.name));
      console.log('[rbpan] notification file found:', !!notificationFile);
      if (!notificationFile) return;

      try {
        let text = await this.readFileText(notificationFile);
        
        // 解析 timeout 属性 - 支持 YAML front matter 格式（单位：毫秒）
        let timeout = 0; // 默认不自动消失
        const yamlTimeoutMatch = text.match(/^---\s*\n[\s\S]*?timeout:\s*(\d+)\s*[\s\S]*?---/m);
        const simpleTimeoutMatch = text.match(/^timeout:\s*(\d+)\s*$/im);
        
        if (yamlTimeoutMatch) {
          timeout = parseInt(yamlTimeoutMatch[1]); // 直接使用毫秒值
          // 移除整个 YAML front matter
          text = text.replace(/^---\s*\n[\s\S]*?---\s*\n?/m, '');
        } else if (simpleTimeoutMatch) {
          timeout = parseInt(simpleTimeoutMatch[1]); // 直接使用毫秒值
          // 移除 timeout 行
          text = text.replace(/^timeout:\s*\d+\s*\n?/im, '');
        }
        
        const ext = this.getFileExtension(notificationFile.name).toLowerCase();
        if (PREVIEW_MD_EXTS.includes(ext)) {
          this.notificationContent = marked.parse(text);
        } else {
          this.notificationContent = '<pre>' + text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
        }
        
        console.log('[rbpan] notification loaded, visible:', !this.announcementVisible);
        
        // 只有在公告未显示时才显示通知
        if (!this.announcementVisible) {
          this.notificationVisible = true;
          console.log('[rbpan] notification showing, timeout:', timeout, 'ms');
          
          // 只有设置了 timeout 且大于 0 才自动消失
          if (timeout > 0) {
            this.notificationTimer = setTimeout(() => {
              this.closeNotification();
              console.log('[rbpan] notification auto-closed');
            }, timeout);
          }
        }
      } catch (e) {
        console.error('Notification load error:', e);
      }
    },

    closeAnnouncement() {
      this.announcementVisible = false;
      
      // 只有勾选了"不再显示"才记录到 localStorage
      if (this.announcementDontShowAgain) {
        localStorage.setItem('rbpan-announcement-dontshow', 'true');
        localStorage.setItem('rbpan-announcement-hash', this.announcementHash);
        console.log('[rbpan] announcement dont show again set');
      }
      
      // 公告关闭后，检查是否显示通知
      this.loadNotification();
    },

    closeNotification() {
      this.notificationClosing = true;
      if (this.notificationTimer) {
        clearTimeout(this.notificationTimer);
        this.notificationTimer = null;
      }
      setTimeout(() => {
        this.notificationVisible = false;
        this.notificationClosing = false;
      }, 400);
    },

    finishInitialLoading() {
      setTimeout(() => {
        this.initialLoading = false;
        setTimeout(() => {
          this.pageReady = true;
        }, 500);
      }, 300);
    },

    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(36);
    },

    async getPreviewBlob(file) {
      const baseUrl = this.manifest.baseUrl || this.manifestUrl.replace(/\/manifest\.json$/, '');
      const chunkExtension = this.manifest.chunkExtension || 'rbpan';
      const threads = this.getThreads();

      if (file.chunks > 1) {
        if (!this.downloader) {
          this.downloader = new ChunkDownloader();
        }
        const { blob } = await this.downloader.downloadFile(file, baseUrl, chunkExtension, threads, (info) => {
          this.previewContent = '<p class="preview-progress">' + (this.t.preview?.loading || '加载中...') + ' ' + info.progress + '%</p>';
        });
        return blob;
      }

      const fileUrl = baseUrl.replace(/\/+$/, '') + '/' + file.path;
      const resp = await fetch(fileUrl);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return await resp.blob();
    },

    getThreads() {
      return APP_CONFIG.downloadThreads > 0 ? APP_CONFIG.downloadThreads : 6;
    },

    streamVideoPreview(file) {
      const ext = this.getFileExtension(file.name).toLowerCase();
      const mimeTypes = {
        mp4: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        webm: 'video/webm; codecs="vp8, vorbis"',
        m4v: 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        ogv: 'video/ogg; codecs="theora, vorbis"',
      };
      const mime = mimeTypes[ext];
      this._streamMedia(file, mime);
    },

    streamAudioPreview(file) {
      const ext = this.getFileExtension(file.name).toLowerCase();
      const mimeTypes = {
        mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
        flac: 'audio/flac', m4a: 'audio/mp4; codecs="mp4a.40.2"',
        aac: 'audio/aac', opus: 'audio/ogg; codecs="opus"',
        weba: 'audio/webm; codecs="opus"', wma: 'audio/x-ms-wma',
      };
      const mime = mimeTypes[ext];
      this._streamMedia(file, mime);
    },

    async _streamMedia(file, mime) {
      const baseUrl = (this.manifest.baseUrl || this.manifestUrl.replace(/\/manifest\.json$/, '')).replace(/\/+$/, '');
      const dirPath = file.path.substring(0, file.path.lastIndexOf('/') + 1);
      const chunkUrls = file.files.map(f => baseUrl + '/' + dirPath + f);
      const maxChunkSize = Math.ceil(file.size / file.chunks);

      if (this._swReady) {
        await this._swReady;
        const streamId = String(++this._streamIdCounter);
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'rbpan-stream-init',
            id: streamId,
            chunkUrls: chunkUrls,
            maxChunkSize: maxChunkSize,
            totalSize: file.size,
            mime: mime,
          });
        }
        this._activeStreams.push(streamId);
        this._videoCleanup = () => this._closeStream(streamId);
        this.previewRawUrl = '/__rbpan_stream/' + streamId;
        this.previewContent = '';
        this.previewLoading = false;
        return;
      }

      const totalChunks = chunkUrls.length;
      const threads = this.getThreads();
      const totalSize = file.size;

      const chunks = new Array(totalChunks);
      let loaded = 0;
      let aborted = false;

      this._videoCleanup = () => { aborted = true; };

      const updateProgress = () => {
        const pct = totalSize ? Math.round((loaded / totalSize) * 100) : 0;
        this.previewContent = '<p class="preview-progress">' + (this.t.preview?.loading || '加载中...') + ' ' + pct + '%</p>';
      };

      const downloadWorker = async () => {
        const queue = chunkUrls.map((url, i) => ({ index: i, url }));
        while (queue.length > 0 && !aborted) {
          const task = queue.shift();
          try {
            const resp = await fetch(task.url);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const buf = await resp.arrayBuffer();
            if (aborted) return;
            chunks[task.index] = new Uint8Array(buf);
            loaded += buf.byteLength;
            updateProgress();
          } catch (e) {
            aborted = true;
            this.previewContent = '<p class="preview-error">' + (this.t.preview?.loadError || 'Failed to load file') + ': ' + e.message + '</p>';
            this.previewLoading = false;
            return;
          }
        }
      };

      const workers = [];
      for (let i = 0; i < Math.min(threads, totalChunks); i++) workers.push(downloadWorker());
      await Promise.all(workers);

      if (aborted) return;

      const url = URL.createObjectURL(new Blob(chunks));
      this.previewRawUrl = url;
      this.previewContent = '';
      this.previewLoading = false;
    },

    _registerSW() {
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker) return;
      this._streamIdCounter = 0;
      this._activeStreams = [];
      this._swReady = new Promise((resolve) => {
        try {
          navigator.serviceWorker.register('sw.js', { scope: '/' })
            .then((reg) => {
              if (reg.active) { resolve(); return; }
              const worker = reg.installing || reg.waiting;
              if (worker) {
                worker.addEventListener('statechange', () => {
                  if (worker.state === 'activated') resolve();
                });
              } else {
                resolve();
              }
              setTimeout(() => resolve(), 5000);
            })
            .catch(() => { this._swReady = null; resolve(); });
        } catch (e) {
          this._swReady = null;
          resolve();
        }
      });
    },

    _closeStream(streamId) {
      const idx = this._activeStreams.indexOf(streamId);
      if (idx >= 0) this._activeStreams.splice(idx, 1);
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'rbpan-stream-close',
          id: streamId,
        });
      }
    },

    escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    async previewFile(file) {
      if (file.type === 'folder') return;
      this.previewModal = true;
      this.previewFileName = file.name;
      this.previewLoading = true;
      this.previewContent = '';
      this.previewType = '';
      this.previewRawUrl = '';
      const ext = this.getFileExtension(file.name).toLowerCase();

      try {
        const isBinary = PREVIEW_IMAGE_EXTS.includes(ext) || PREVIEW_AUDIO_EXTS.includes(ext) || PREVIEW_VIDEO_EXTS.includes(ext) || PREVIEW_PDF_EXTS.includes(ext);

        if (isBinary) {
          if (PREVIEW_VIDEO_EXTS.includes(ext) && file.chunks > 1) {
            this.previewType = 'video';
            this.previewLoading = false;
            Vue.nextTick(() => this.streamVideoPreview(file));
            return;
          }
          if (PREVIEW_AUDIO_EXTS.includes(ext) && file.chunks > 1) {
            this.previewType = 'audio';
            this.previewLoading = false;
            Vue.nextTick(() => this.streamAudioPreview(file));
            return;
          }
          const blob = await this.getPreviewBlob(file);
          this.previewRawUrl = URL.createObjectURL(blob);
          if (PREVIEW_IMAGE_EXTS.includes(ext)) {
            this.previewType = 'image';
          } else if (PREVIEW_AUDIO_EXTS.includes(ext)) {
            this.previewType = 'audio';
          } else if (PREVIEW_VIDEO_EXTS.includes(ext)) {
            this.previewType = 'video';
          } else if (PREVIEW_PDF_EXTS.includes(ext)) {
            this.previewType = 'pdf';
          }
          this.previewLoading = false;
          return;
        }

        if (PREVIEW_DOCX_EXTS.includes(ext)) {
          const blob = await this.getPreviewBlob(file);
          this.previewType = 'docx';
          this.previewLoading = false;
          Vue.nextTick(() => this.renderDocxPreviewFromBlob(blob));
          return;
        }

        if (PREVIEW_XLSX_EXTS.includes(ext)) {
          const blob = await this.getPreviewBlob(file);
          this.previewType = 'xlsx';
          this.previewLoading = false;
          Vue.nextTick(() => this.renderXlsxPreviewFromBlob(blob));
          return;
        }

        if (PREVIEW_PPTX_EXTS.includes(ext)) {
          const blob = await this.getPreviewBlob(file);
          this.previewType = 'pptx';
          this.previewLoading = false;
          Vue.nextTick(() => this.renderPptxPreviewFromBlob(blob));
          return;
        }

        const isTextFile = PREVIEW_MD_EXTS.includes(ext) ||
          PREVIEW_HTML_EXTS.includes(ext) ||
          PREVIEW_CODE_EXTS.includes(ext) ||
          PREVIEW_TEXT_EXTS.includes(ext);

        const canStream = file.chunks <= 1;
        if (isTextFile && canStream) {
          await this.streamPreviewFile(file, ext);
          return;
        }

        const blob = await this.getPreviewBlob(file);
        const text = await blob.text();

        if (PREVIEW_MD_EXTS.includes(ext)) {
          this.previewType = 'markdown';
          this.previewContent = marked.parse(text);
        } else if (PREVIEW_HTML_EXTS.includes(ext)) {
          this.previewType = 'html';
          this.previewContent = text;
        } else if (PREVIEW_CODE_EXTS.includes(ext)) {
          this.previewType = 'code';
          this.previewContent = '<pre><code class="hljs">' + highlightCode(text, ext) + '</code></pre>';
        } else {
          this.previewType = 'text';
          this.previewContent = '<pre>' + this.escapeHtml(text) + '</pre>';
        }
      } catch (e) {
        this.previewContent = '<p class="preview-error">' + (this.t.preview?.loadError || 'Failed to load file') + ': ' + e.message + '</p>';
      } finally {
        this.previewLoading = false;
      }
    },

    async streamPreviewFile(file, ext) {
      const previewType = PREVIEW_MD_EXTS.includes(ext) ? 'markdown' :
        PREVIEW_HTML_EXTS.includes(ext) ? 'html' :
        PREVIEW_CODE_EXTS.includes(ext) ? 'code' : 'text';

      this.previewType = previewType;
      this.previewContent = '';

      try {
        const url = this._getFileRawUrl(file);
        const response = await fetch(url);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        if (!response.body) throw new Error('ReadableStream not supported');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';
        const CHUNK_SIZE = 65536;

        const readChunk = ({ done, value }) => {
          if (done) {
            this._renderStreamedContent(accumulated, ext, previewType, true);
            this.previewLoading = false;
            return;
          }
          accumulated += decoder.decode(value, { stream: true });
          if (accumulated.length > CHUNK_SIZE) {
            this._renderStreamedContent(accumulated, ext, previewType, false);
          }
          return reader.read().then(readChunk);
        };

        this.previewLoading = false;
        return reader.read().then(readChunk);
      } catch (e) {
        if (this.previewContent === '') {
          this.previewContent = '<p class="preview-error">' + (this.t.preview?.loadError || 'Failed to load file') + ': ' + e.message + '</p>';
        }
        this.previewLoading = false;
      }
    },

    _renderStreamedContent(text, ext, previewType, isFinal) {
      if (previewType === 'markdown') {
        this.previewContent = marked.parse(text);
      } else if (previewType === 'html') {
        this.previewContent = text;
      } else if (previewType === 'code') {
        const highlighted = highlightCode(text, ext);
        this.previewContent = '<pre><code class="hljs">' + highlighted + '</code></pre>';
      } else {
        this.previewContent = '<pre>' + this.escapeHtml(text) + '</pre>';
      }
    },

    _getFileRawUrl(file) {
      const baseUrl = (this.manifest.baseUrl || this.manifestUrl.replace(/\/manifest\.json$/, '')).replace(/\/+$/, '');
      return baseUrl + '/' + file.path;
    },

    async renderDocxPreviewFromBlob(blob) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        const container = this.$refs.docxPreview;
        if (container) {
          container.innerHTML = result.value || '<p class="preview-error">Empty document</p>';
          if (result.messages && result.messages.length > 0) {
            console.warn('mammoth warnings:', result.messages);
          }
        }
      } catch (e) {
        const container = this.$refs.docxPreview;
        if (container) {
          container.innerHTML = '<p class="preview-error">Failed to load DOCX: ' + e.message + '</p>';
        }
      }
    },

    async renderXlsxPreviewFromBlob(blob) {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let html = '<div class="xlsx-tabs">';
        workbook.SheetNames.forEach((name, i) => {
          html += `<button class="xlsx-tab" data-index="${i}" onclick="this.parentElement.querySelectorAll('.xlsx-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');document.querySelectorAll('.xlsx-sheet').forEach(s=>s.style.display='none');document.querySelector('.xlsx-sheet[data-index=\\'${i}\\']').style.display='block';">${name}</button>`;
        });
        html += '</div>';
        workbook.SheetNames.forEach((name, i) => {
          const sheet = workbook.Sheets[name];
          const sheetHtml = XLSX.utils.sheet_to_html(sheet, { editable: false });
          html += `<div class="xlsx-sheet" data-index="${i}" style="display:${i === 0 ? 'block' : 'none'};">${sheetHtml}</div>`;
        });
        const container = this.$refs.xlsxPreview;
        if (container) {
          container.innerHTML = html;
        }
      } catch (e) {
        const container = this.$refs.xlsxPreview;
        if (container) {
          container.innerHTML = '<p class="preview-error">Failed to load XLSX: ' + e.message + '</p>';
        }
      }
    },

    async renderPptxPreviewFromBlob(blob) {
      const container = this.$refs.pptxPreview;
      if (container) {
        container.innerHTML = '<p class="preview-info">PPTX preview is not supported in browser. Please download to view.</p>';
      }
    },

    closePreview() {
      if (this._videoCleanup) {
        this._videoCleanup();
        this._videoCleanup = null;
      }
      if (this.previewRawUrl && this.previewRawUrl.startsWith('blob:')) {
        URL.revokeObjectURL(this.previewRawUrl);
      }
      this.previewModal = false;
      this.previewContent = '';
      this.previewRawUrl = '';
    },

    updateUrl() {
      const params = new URLSearchParams();
      if (this.currentPath) params.set('path', this.currentPath);
      const qs = params.toString();
      const newUrl = window.location.pathname + (qs ? '?' + qs : '');
      history.replaceState(null, '', newUrl);
    },

    initFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const path = params.get('path');
      if (path) {
        this.navigateTo(path);
        return true;
      }
      return false;
    },

    async startDownload(file) {
      if (!this.downloader) {
        this.downloader = new ChunkDownloader();
        this.hashVerifier = new HashVerifier();
      }

      var resumeId = file.path;
      this.currentDownloadId = resumeId;

      this.downloadModal = true;
      this.downloadFileName = file.name;
      this.downloadProgress = 0;
      this.downloadSpeed = '';
      this.downloadDetail = '';
      this.downloadCancellable = true;
      this.downloadPaused = false;
      this.currentDownloadCtrl = null;

      // 检查是否有可恢复的下载
      var resumeState = await ResumeDB.load(resumeId);
      if (resumeState && (resumeState.loaded || resumeState.downloadedChunks)) {
        var loaded = resumeState.loaded || 0;
        var totalChunks = 0;
        if (resumeState.downloadedChunks) {
          totalChunks = Object.keys(resumeState.downloadedChunks).length;
        }
        var continueDownload = confirm(
          (this.t.download?.resumePrompt || 'An incomplete download was found ({loaded} downloaded). Continue?').replace('{loaded}', this.formatSize(loaded))
        );
        if (!continueDownload) {
          await ResumeDB.remove(resumeId);
          resumeState = null;
        }
      }

      RbpanPlugins.onDownloadStart(file);

      var baseUrl = this.manifest.baseUrl || this.manifestUrl.replace(/\/manifest\.json$/, '');
      var chunkExtension = this.manifest.chunkExtension || 'rbpan';
      var threads = this.getThreads();

      var self = this;

      try {
        var result = await this.downloader.downloadFile(
          file, baseUrl, chunkExtension, threads,
          function (info) {
            self.downloadProgress = info.progress;
            self.downloadSpeed = self.formatSize(info.speed) + '/s';
            if (info.totalChunks) {
              var tpl = self.t.download?.chunkProgress || 'Chunk {done}/{total}';
              self.downloadDetail = tpl.replace('{done}', info.chunk).replace('{total}', info.totalChunks);
            }
            if (info.resumed) {
              self.downloadDetail = (self.t.download?.resumed || 'Resumed from {pct}%').replace('{pct}', info.progress);
            }
          },
          resumeId
        );
        var blob = result.blob;

        this.downloadCancellable = false;
        this.downloadPaused = false;
        this.currentDownloadId = null;
        this.downloadDetail = this.t.download?.verifying || 'Verifying...';

        var expectedHash = file.sha256;
        if (expectedHash) {
          var ok = await this.hashVerifier.verify(blob, expectedHash);
          if (ok) {
            this.downloadDetail = this.t.download?.verifyOk || 'SHA-256 verified';
          } else {
            this.downloadDetail = this.t.download?.verifyFail || 'SHA-256 verification failed!';
            RbpanPlugins.onDownloadError(file, new Error('SHA-256 mismatch'));
            return;
          }
        }

        this.downloadDetail = this.t.download?.complete || 'Download complete';
        RbpanPlugins.onDownloadComplete(file);

        setTimeout(function () {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        }, 500);
      } catch (err) {
        if (err.message === 'Aborted') return;
        this.downloadDetail = (this.t.download?.failed || 'Download failed') + ': ' + err.message;
        this.downloadCancellable = false;
        this.downloadPaused = false;
        this.currentDownloadId = null;
        RbpanPlugins.onDownloadError(file, err);
      }
    },

    pauseDownload() {
      if (this.downloader && this.currentDownloadId) {
        this.downloader.pauseDownload(this.currentDownloadId);
        this.downloadPaused = true;
        this.downloadDetail = this.t.download?.paused || 'Paused - click Resume to continue';
      }
    },

    resumeDownload() {
      if (this.downloader && this.currentDownloadId) {
        this.downloader.resumeDownload(this.currentDownloadId);
        this.downloadPaused = false;
        this.downloadDetail = this.t.download?.resuming || 'Resuming...';
      }
    },

    cancelDownload() {
      if (this.downloader && this.currentDownloadId) {
        this.downloader.cancelDownload(this.currentDownloadId);
      } else if (this.downloader) {
        this.downloader.cancelAll();
      }
      this.currentDownloadId = null;
      this.downloadPaused = false;
      this.downloadModal = false;
    },

    toggleTheme() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', this.currentTheme);
      localStorage.setItem('rbpan-theme', this.currentTheme);
      RbpanPlugins.onThemeChange(this.currentTheme);
    },

    toggleLangDropdown() {
      this.langDropdownOpen = !this.langDropdownOpen;
    },

    selectLanguage(lang) {
      if (this.currentLang === lang) {
        this.langDropdownOpen = false;
        return;
      }
      this.currentLang = lang;
      this.t = this.getLangPack(lang);
      this.updateHtmlLang();
      this.langDropdownOpen = false;
      localStorage.setItem('rbpan-lang', lang);
    },

    toggleLanguage() {
      const langs = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'];
      const idx = langs.indexOf(this.currentLang);
      this.currentLang = langs[(idx + 1) % langs.length];
      this.t = this.getLangPack(this.currentLang);
      this.updateHtmlLang();
      localStorage.setItem('rbpan-lang', this.currentLang);
    },

    getLangPack(lang) {
      const packs = {
        'zh-CN': I18N_ZH_CN,
        'zh-TW': I18N_ZH_TW,
        'en': I18N_EN,
        'ja': I18N_JA,
        'ko': I18N_KO,
      };
      return packs[lang] || I18N_ZH_CN;
    },

    updateHtmlLang() {
      document.documentElement.setAttribute('lang', this.currentLang);
      document.documentElement.setAttribute('translate', 'no');
      document.title = (this.t.app?.title || 'rbpan') + ' - ' + (this.t.app?.subtitle || '');
    },

    initTheme() {
      const saved = localStorage.getItem('rbpan-theme');
      if (saved) {
        this.currentTheme = saved;
      }
      document.documentElement.setAttribute('data-theme', this.currentTheme);
    },

    initLang() {
      const saved = localStorage.getItem('rbpan-lang');
      if (saved) {
        this.currentLang = saved;
      }
      this.t = this.getLangPack(this.currentLang);
      this.updateHtmlLang();
    },

    initAccentColor() {
      if (APP_CONFIG.accentColor) {
        this.applyAccentColor(APP_CONFIG.accentColor);
      }
      if (APP_CONFIG.beautify) {
        document.documentElement.classList.add('beautify-enabled');
      }
    },

    initFontFamily() {
      if (APP_CONFIG.fontFamily) {
        document.documentElement.style.fontFamily = `'${APP_CONFIG.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif`;
      }
    },

    initBgImage() {
      if (APP_CONFIG.bgImage) {
        this.applyBgImage(APP_CONFIG.bgImage);
      }
    },

    initPreset() {
      if (APP_CONFIG.preset) {
        document.documentElement.setAttribute('data-preset', APP_CONFIG.preset);
      }
    },

    applyAccentColor(color) {
      const root = document.documentElement;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      root.style.setProperty('--accent', color);
      root.style.setProperty('--accent-via', `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 30)},${Math.min(255, b + 50)})`);
      root.style.setProperty('--accent-soft', `rgba(${r},${g},${b},0.08)`);
      root.style.setProperty('--accent-hover', `rgb(${Math.max(0, r - 30)},${Math.max(0, g - 25)},${Math.max(0, b - 20)})`);
      root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.25)`);
      root.style.setProperty('--folder-hover', `rgba(${r},${g},${b},0.04)`);
    },

    applyBgImage(url) {
      let bgEl = document.getElementById('rbpan-bg-image');
      if (!bgEl) {
        bgEl = document.createElement('div');
        bgEl.id = 'rbpan-bg-image';
        bgEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:-2;background-size:cover;background-position:center;background-repeat:no-repeat;';
        document.body.appendChild(bgEl);
      }
      bgEl.style.backgroundImage = `url(${url})`;
    },

    toggleShowFolderImage() {
      this.showFolderImage = !this.showFolderImage;
      localStorage.setItem('rbpan-show-folder-image', this.showFolderImage.toString());
    },

    toggleShowFileCount() {
      this.showFileCount = !this.showFileCount;
      localStorage.setItem('rbpan-show-file-count', this.showFileCount.toString());
    },

    toggleShowGalleryThumb() {
      this.showGalleryThumb = !this.showGalleryThumb;
      localStorage.setItem('rbpan-show-gallery-thumb', this.showGalleryThumb.toString());
    },

    toggleRememberLastImage() {
      this.rememberLastImage = !this.rememberLastImage;
      localStorage.setItem('rbpan-remember-last-image', this.rememberLastImage.toString());
    },

    toggleReducedMotion() {
      this.reducedMotion = !this.reducedMotion;
      if (this.reducedMotion) {
        document.documentElement.setAttribute('data-reduced-motion', '');
      } else {
        document.documentElement.removeAttribute('data-reduced-motion');
      }
      localStorage.setItem('rbpan-reduced-motion', this.reducedMotion.toString());
    },

    initToggleSettings() {
      const savedFolderImg = localStorage.getItem('rbpan-show-folder-image');
      if (savedFolderImg !== null) this.showFolderImage = savedFolderImg === 'true';

      const savedFileCount = localStorage.getItem('rbpan-show-file-count');
      if (savedFileCount !== null) this.showFileCount = savedFileCount === 'true';

      const savedGalleryThumb = localStorage.getItem('rbpan-show-gallery-thumb');
      if (savedGalleryThumb !== null) this.showGalleryThumb = savedGalleryThumb === 'true';

      const savedLastImage = localStorage.getItem('rbpan-remember-last-image');
      if (savedLastImage !== null) this.rememberLastImage = savedLastImage === 'true';

      const savedReducedMotion = localStorage.getItem('rbpan-reduced-motion');
      if (savedReducedMotion === 'true') {
        this.reducedMotion = true;
        document.documentElement.setAttribute('data-reduced-motion', '');
      }
    },

    onDocumentClick(e) {
      if (this.langDropdownOpen && !e.target.closest('.lang-dropdown-wrapper')) {
        this.langDropdownOpen = false;
      }
    },
  },

  mounted() {
    this._registerSW();
    this.initTheme();
    this.initLang();
    this.initAccentColor();
    this.initFontFamily();
    this.initBgImage();
    this.initPreset();
    this.initToggleSettings();
    document.addEventListener('click', this.onDocumentClick);
    console.log('[rbpan] mounted, loading manifest...');
    this.loadManifest();
  },

  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
  },
});

app.mount('#app');