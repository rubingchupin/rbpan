(function () {
  'use strict';

  var _cache = { manifests: {} };
  var CHUNK_EXT = null;

  function buildUrl(base, path) {
    return base.replace(/\/+$/, '') + '/' + path;
  }

  function findFile(files, targetPath) {
    var parts = targetPath.replace(/^\/+/, '').split('/').filter(Boolean);
    if (!parts.length) return null;
    var current = files;
    for (var i = 0; i < parts.length; i++) {
      var found = null;
      for (var j = 0; j < current.length; j++) {
        if (current[j].name === parts[i]) { found = current[j]; break; }
      }
      if (!found) return null;
      if (i === parts.length - 1) return found;
      if (found.type === 'folder' && found.children) { current = found.children; }
      else return null;
    }
    return null;
  }

  function countFiles(files) {
    var n = 0;
    for (var i = 0; i < files.length; i++) {
      if (files[i].type === 'file') n++;
      else if (files[i].children) n += countFiles(files[i].children);
    }
    return n;
  }

  function downloadSingle(url, totalSize, signal, onProgress) {
    return fetch(url, signal ? { signal: signal } : {}).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);

      // IE 回退：不支持 ReadableStream，使用 blob/arrayBuffer
      if (!r.body || !r.body.getReader || typeof ReadableStream === 'undefined') {
        return r.blob().then(function (blob) {
          if (totalSize && blob.size !== totalSize) throw new Error('Incomplete: ' + blob.size + '/' + totalSize);
          if (onProgress) {
            onProgress({ progress: 100, speed: 0, loaded: blob.size, total: totalSize });
          }
          return { blob: blob, size: blob.size };
        });
      }

      var reader = r.body.getReader();
      var chunks = [], loaded = 0, t0 = Date.now();
      function read() {
        return reader.read().then(function (x) {
          if (x.done) {
            if (totalSize && loaded !== totalSize) throw new Error('Incomplete: ' + loaded + '/' + totalSize);
            return { blob: new Blob(chunks), size: loaded };
          }
          chunks.push(x.value);
          loaded += x.value.length;
          if (onProgress) {
            var s = (Date.now() - t0) / 1000;
            onProgress({ progress: totalSize ? Math.round(loaded / totalSize * 100) : 100, speed: s > 0 ? loaded / s : 0, loaded: loaded, total: totalSize });
          }
          return read();
        });
      }
      return read();
    });
  }

  function downloadChunks(chunkUrls, totalSize, threads, signal, onProgress) {
    var n = chunkUrls.length;
    var tc = threads === 0 ? n : Math.min(threads || 6, n);
    var downloaded = new Array(n);
    var loaded = 0, done = 0, t0 = Date.now(), aborted = false;
    var queue = chunkUrls.map(function (u, i) { return { i: i, url: u }; });

    function worker() {
      function next() {
        if (aborted || (signal && signal.aborted)) return Promise.resolve();
        if (!queue.length) return Promise.resolve();
        var t = queue.shift();
        return fetch(t.url, signal ? { signal: signal } : {}).then(function (r) {
          if (!r.ok) throw new Error('Chunk ' + (t.i + 1) + ' HTTP ' + r.status);
          return r.arrayBuffer();
        }).then(function (buf) {
          downloaded[t.i] = new Uint8Array(buf);
          done++; loaded += buf.byteLength;
          if (onProgress) {
            var s = (Date.now() - t0) / 1000;
            onProgress({ progress: Math.round(loaded / totalSize * 100), speed: s > 0 ? loaded / s : 0, loaded: loaded, total: totalSize, chunk: done, totalChunks: n });
          }
          return next();
        }).catch(function (e) { aborted = true; throw e; });
      }
      return next();
    }

    var workers = [];
    for (var i = 0; i < tc; i++) workers.push(worker());
    return Promise.all(workers).then(function () {
      if (totalSize && loaded !== totalSize) throw new Error('Incomplete: ' + loaded + '/' + totalSize);
      var blob = new Blob(downloaded);
      return { blob: blob, size: loaded };
    });
  }

  function triggerSave(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function parseRbpanUrl(url) {
    var m = url.match(/^rbpan:\/\/([^\/]+)(\/.*)?$/);
    if (!m) return null;
    return { baseUrl: 'https://' + m[1], filePath: (m[2] || '').replace(/^\/+/, '') };
  }

  function resolveRbpan(url, threads) {
    var p = parseRbpanUrl(url);
    if (!p) return Promise.reject(new Error('Invalid rbpan:// URL'));
    return Rbpan.loadManifest(p.baseUrl).then(function (m) {
      CHUNK_EXT = m.chunkExtension || 'rbpan';
      var f = findFile(m.files, p.filePath);
      if (!f) throw new Error('File not found: ' + p.filePath);
      if (f.type !== 'file') throw new Error('Not a file: ' + p.filePath);
      var base = m.baseUrl || p.baseUrl;
      if (f.chunks === 1) return downloadSingle(buildUrl(base, f.path), f.size).then(function (r) { return r.blob; });
      var dir = f.path.substring(0, f.path.lastIndexOf('/') + 1);
      var urls = f.files.map(function (fn) { return buildUrl(base, dir + fn); });
      return downloadChunks(urls, f.size, threads != null ? threads : 6).then(function (r) { return r.blob; });
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="rbpan://"]');
    if (!a) return;
    e.preventDefault();
    resolveRbpan(a.getAttribute('href')).then(function (blob) {
      triggerSave(blob, a.getAttribute('download') || a.textContent.trim() || 'download');
    }).catch(function (err) {
      console.error('[rbpan]', err.message);
      if (a.dataset.rbpanFallback) window.location.href = a.dataset.rbpanFallback;
    });
  });

  var Rbpan = {
    loadManifest: function (baseUrl) {
      var url = baseUrl.replace(/\/+$/, '') + '/manifest.json';
      if (_cache.manifests[url]) return Promise.resolve(_cache.manifests[url]);
      return fetch(url + '?t=' + Date.now()).then(function (r) {
        if (!r.ok) throw new Error('Manifest HTTP ' + r.status);
        return r.json();
      }).then(function (d) { _cache.manifests[url] = d; return d; });
    },

    findFile: function (manifest, path) { return findFile(manifest.files, path); },

    listFiles: function (manifest, dir) {
      if (!dir) return manifest.files;
      var f = findFile(manifest.files, dir);
      return f && f.type === 'folder' ? (f.children || []) : [];
    },

    getFileInfo: function (manifest, path) { return findFile(manifest.files, path); },

    downloadFile: function (manifest, path, opts) {
      opts = opts || {};
      var f = findFile(manifest.files, path);
      if (!f || f.type !== 'file') return Promise.reject(new Error('File not found: ' + path));
      var base = (manifest.baseUrl || '').replace(/\/+$/, '');
      if (f.chunks === 1) return downloadSingle(buildUrl(base, f.path), f.size, opts.signal, opts.onProgress);
      var dir = f.path.substring(0, f.path.lastIndexOf('/') + 1);
      var urls = f.files.map(function (fn) { return buildUrl(base, dir + fn); });
      return downloadChunks(urls, f.size, opts.threads || 6, opts.signal, opts.onProgress);
    },

    saveFile: function (manifest, path, filename) {
      return this.downloadFile(manifest, path).then(function (r) {
        triggerSave(r.blob, filename || path.split('/').pop());
        return { blob: r.blob, filename: filename || path.split('/').pop() };
      });
    },

    readText: function (manifest, path) {
      return this.downloadFile(manifest, path).then(function (r) { return r.blob.text(); });
    },

    readJson: function (manifest, path) {
      return this.readText(manifest, path).then(JSON.parse);
    },

    searchFiles: function (manifest, query) {
      var q = query.toLowerCase(), results = [];
      (function walk(files, p) {
        for (var i = 0; i < files.length; i++) {
          if (files[i].name.toLowerCase().indexOf(q) !== -1) results.push({ file: files[i], path: p });
          if (files[i].type === 'folder' && files[i].children) walk(files[i].children, p ? p + '/' + files[i].name : files[i].name);
        }
      })(manifest.files, '');
      return results;
    },

    getInfo: function (manifest) {
      return {
        name: manifest.name, version: manifest.version,
        generatedAt: manifest.generatedAt, baseUrl: manifest.baseUrl,
        chunkExtension: manifest.chunkExtension, fileCount: countFiles(manifest.files),
      };
    },

    clearCache: function () { _cache.manifests = {}; },

    resolve: resolveRbpan,
    parse: parseRbpanUrl,
    chunkExtension: function () { return CHUNK_EXT; },
  };

  window.Rbpan = Rbpan;
  window.RbpanLink = Rbpan;
  if (typeof module !== 'undefined' && module.exports) module.exports = Rbpan;
})();