(function () {
  'use strict';

  var CHUNK_EXT = null;

  function parseRbpanUrl(url) {
    var m = url.match(/^rbpan:\/\/([^\/]+)(\/.*)?$/);
    if (!m) return null;
    var host = m[1];
    var filePath = (m[2] || '').replace(/^\/+/, '');
    var baseUrl = 'https://' + host;
    return { baseUrl: baseUrl, filePath: filePath };
  }

  function findFile(files, targetPath) {
    var parts = targetPath.split('/').filter(Boolean);
    var current = files;
    for (var i = 0; i < parts.length; i++) {
      var found = null;
      for (var j = 0; j < current.length; j++) {
        if (current[j].name === parts[i]) {
          found = current[j];
          break;
        }
      }
      if (!found) return null;
      if (i === parts.length - 1) return found;
      if (found.type === 'folder' && found.children) {
        current = found.children;
      } else {
        return null;
      }
    }
    return null;
  }

  function buildChunkUrl(baseUrl, fileInfo, chunkFile) {
    var dirPath = fileInfo.path.substring(0, fileInfo.path.lastIndexOf('/') + 1);
    var base = baseUrl.replace(/\/+$/, '');
    return base + '/' + dirPath + chunkFile;
  }

  function downloadSingle(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    });
  }

  function downloadChunks(baseUrl, fileInfo, threads) {
    var chunkFiles = fileInfo.files;
    var totalSize = fileInfo.size;
    var totalChunks = chunkFiles.length;
    var threadCount = Math.min(threads || 6, totalChunks);
    var downloaded = new Array(totalChunks);
    var completed = 0;
    var queue = chunkFiles.map(function (f, i) { return { index: i, url: buildChunkUrl(baseUrl, fileInfo, f) }; });

    function worker() {
      return new Promise(function (resolve, reject) {
        function next() {
          if (queue.length === 0) return resolve();
          var task = queue.shift();
          fetch(task.url)
            .then(function (r) {
              if (!r.ok) throw new Error('Chunk ' + (task.index + 1) + ' HTTP ' + r.status);
              return r.arrayBuffer();
            })
            .then(function (buf) {
              downloaded[task.index] = new Uint8Array(buf);
              completed++;
              next();
            })
            .catch(reject);
        }
        next();
      });
    }

    var workers = [];
    for (var i = 0; i < threadCount; i++) workers.push(worker());

    return Promise.all(workers).then(function () {
      var merged = new Uint8Array(totalSize);
      var offset = 0;
      for (var i = 0; i < downloaded.length; i++) {
        if (!downloaded[i]) throw new Error('Chunk ' + (i + 1) + ' missing');
        merged.set(downloaded[i], offset);
        offset += downloaded[i].length;
      }
      return new Blob([merged]);
    });
  }

  function triggerSave(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function resolve(url, threads) {
    var parsed = parseRbpanUrl(url);
    if (!parsed) return Promise.reject(new Error('Invalid rbpan:// URL'));

    var manifestUrl = parsed.baseUrl.replace(/\/+$/, '') + '/manifest.json';

    return fetch(manifestUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('Manifest HTTP ' + r.status);
        return r.json();
      })
      .then(function (manifest) {
        CHUNK_EXT = manifest.chunkExtension || 'rbpan';
        var fileInfo = findFile(manifest.files, parsed.filePath);
        if (!fileInfo) throw new Error('File not found: ' + parsed.filePath);
        if (fileInfo.type !== 'file') throw new Error('Path is not a file: ' + parsed.filePath);

        var baseUrl = manifest.baseUrl || parsed.baseUrl;

        if (fileInfo.chunks === 1) {
          return downloadSingle(buildChunkUrl(baseUrl, fileInfo, fileInfo.files[0]));
        }
        return downloadChunks(baseUrl, fileInfo, threads || 6);
      });
  }

  function handleClick(e) {
    var link = e.target.closest('a[href^="rbpan://"]');
    if (!link) return;
    e.preventDefault();

    var url = link.getAttribute('href');
    var filename = link.getAttribute('download') || link.textContent.trim() || 'download';

    resolve(url).then(function (blob) {
      triggerSave(blob, filename);
    }).catch(function (err) {
      console.error('[rbpan]', err.message);
      if (link.dataset.rbpanFallback) {
        window.location.href = link.dataset.rbpanFallback;
      }
    });
  }

  document.addEventListener('click', handleClick);

  window.RbpanLink = {
    resolve: resolve,
    parse: parseRbpanUrl,
    findFile: findFile,
    chunkExtension: function () { return CHUNK_EXT; },
  };
})();