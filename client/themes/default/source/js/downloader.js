var ResumeDB = (function () {
  var DB_NAME = 'rbpan_downloads';
  var DB_VERSION = 1;
  var STORE_NAME = 'downloads';

  var db = null;
  var dbReady = null;

  function open() {
    if (dbReady) return dbReady;
    dbReady = new Promise(function (resolve) {
      if (!window.indexedDB) { db = null; resolve(null); return; }
      var req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains(STORE_NAME)) {
          d.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = function (e) { db = e.target.result; resolve(db); };
      req.onerror = function () { db = null; resolve(null); };
    });
    return dbReady;
  }

  function saveState(id, data) {
    return open().then(function (d) {
      if (!d) return;
      return new Promise(function (resolve) {
        try {
          var tx = d.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          store.put({ id: id, data: data, updated: Date.now() });
          tx.oncomplete = resolve;
          tx.onerror = function () { resolve(); };
        } catch (e) { resolve(); }
      });
    });
  }

  function loadState(id) {
    return open().then(function (d) {
      if (!d) return null;
      return new Promise(function (resolve) {
        try {
          var tx = d.transaction(STORE_NAME, 'readonly');
          var store = tx.objectStore(STORE_NAME);
          var req = store.get(id);
          req.onsuccess = function () { resolve(req.result ? req.result.data : null); };
          req.onerror = function () { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }

  function deleteState(id) {
    return open().then(function (d) {
      if (!d) return;
      return new Promise(function (resolve) {
        try {
          var tx = d.transaction(STORE_NAME, 'readwrite');
          var store = tx.objectStore(STORE_NAME);
          store.delete(id);
          tx.oncomplete = resolve;
          tx.onerror = function () { resolve(); };
        } catch (e) { resolve(); }
      });
    });
  }

  function listStates() {
    return open().then(function (d) {
      if (!d) return [];
      return new Promise(function (resolve) {
        try {
          var tx = d.transaction(STORE_NAME, 'readonly');
          var store = tx.objectStore(STORE_NAME);
          var req = store.getAll();
          req.onsuccess = function () { resolve(req.result || []); };
          req.onerror = function () { resolve([]); };
        } catch (e) { resolve([]); }
      });
    });
  }

  return {
    save: saveState,
    load: loadState,
    remove: deleteState,
    list: listStates,
    isAvailable: function () { return !!window.indexedDB; }
  };
})();

class ChunkDownloader {
  constructor() {
    this.activeDownloads = new Map();
    this.abortControllers = new Map();
    this.paused = new Map();
    this.pauseCallbacks = new Map();
  }

  async downloadFile(fileInfo, baseUrl, chunkExtension, threads, onProgress, resumeId) {
    var downloadId = resumeId || Date.now().toString();
    var abortController = new AbortController();
    this.abortControllers.set(downloadId, abortController);
    this.paused.set(downloadId, false);

    try {
      var chunks = fileInfo.chunks || 1;
      var totalSize = fileInfo.size;

      var resumeState = null;
      if (resumeId) {
        resumeState = await ResumeDB.load(downloadId);
      }

      var result;
      if (chunks === 1) {
        var fileUrl = this.buildUrl(baseUrl, fileInfo.path);
        result = await this.downloadSingle(
          fileUrl, totalSize, abortController.signal, onProgress, downloadId, resumeState
        );
      } else {
        var chunkUrls = this.buildChunkUrls(baseUrl, fileInfo, chunkExtension);
        result = await this.downloadChunks(
          chunkUrls, totalSize, threads, abortController.signal, onProgress, downloadId, resumeState
        );
      }

      await ResumeDB.remove(downloadId);
      return result;
    } finally {
      this.abortControllers.delete(downloadId);
      this.paused.delete(downloadId);
      this.pauseCallbacks.delete(downloadId);
    }
  }

  buildUrl(baseUrl, filePath) {
    return baseUrl.replace(/\/+$/, '') + '/' + filePath;
  }

  buildChunkUrls(baseUrl, fileInfo, chunkExtension) {
    var ext = chunkExtension || 'rbpan';
    var dirPath = fileInfo.path.substring(0, fileInfo.path.lastIndexOf('/') + 1);
    var base = baseUrl.replace(/\/+$/, '');
    return fileInfo.files.map(function (f) { return base + '/' + dirPath + f; });
  }

  async downloadSingle(url, totalSize, signal, onProgress, downloadId, resumeState) {
    var loaded = 0;
    var chunks = [];

    if (resumeState && resumeState.loaded > 0) {
      loaded = resumeState.loaded;
    }

    // 直接尝试 Range 请求，失败则回退到完整下载
    var response;
    var resumed = false;
    if (loaded > 0) {
      response = await fetch(url, {
        headers: { 'Range': 'bytes=' + loaded + '-' },
        signal: signal
      });
      if (response.status === 206) {
        resumed = true;
        if (totalSize) {
          var contentRange = response.headers.get('Content-Range');
          if (contentRange) {
            var match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
            if (match) totalSize = parseInt(match[3], 10);
          }
        }
      } else {
        loaded = 0;
        response = await fetch(url, { signal: signal });
      }
    } else {
      response = await fetch(url, { signal: signal });
    }

    if (!response.ok) throw new Error('HTTP ' + response.status);

    if (onProgress && resumed) {
      onProgress({ progress: totalSize ? Math.round(loaded / totalSize * 100) : 0, speed: 0, loaded: loaded, total: totalSize, resumed: true });
    }

    // IE 回退
    if (!response.body || !response.body.getReader || typeof ReadableStream === 'undefined') {
      var blob = await response.blob();
      if (totalSize && blob.size !== totalSize) throw new Error('Incomplete: ' + blob.size + '/' + totalSize);
      if (onProgress) onProgress({ progress: 100, speed: 0, loaded: blob.size, total: totalSize });
      return { blob: blob, size: blob.size };
    }

    return await this._readStream(response, loaded, totalSize, signal, onProgress, downloadId, chunks);
  }

  async _readStream(response, loaded, totalSize, signal, onProgress, downloadId, chunks) {
    var reader = response.body.getReader();
    var startTime = Date.now();
    var startLoaded = loaded;
    var self = this;

    while (true) {
      if (signal.aborted) break;

      if (self.paused.get(downloadId)) {
        await new Promise(function (resolve) {
          self.pauseCallbacks.set(downloadId, resolve);
        });
        self.pauseCallbacks.delete(downloadId);
        startTime = Date.now();
        startLoaded = loaded;
      }

      var result;
      try {
        result = await reader.read();
      } catch (e) {
        throw e;
      }

      if (result.done) break;

      chunks.push(result.value);
      loaded += result.value.length;

      if (onProgress) {
        var elapsed = (Date.now() - startTime) / 1000;
        var speed = elapsed > 0 ? (loaded - startLoaded) / elapsed : 0;
        var progress = totalSize > 0 ? Math.round(loaded / totalSize * 100) : 100;
        onProgress({ progress: progress, speed: speed, loaded: loaded, total: totalSize });
      }
    }

    if (totalSize > 0 && loaded !== totalSize) {
      throw new Error('Download incomplete: received ' + loaded + ' of ' + totalSize + ' bytes');
    }

    var blob = new Blob(chunks);
    return { blob: blob, size: blob.size };
  }

  async downloadChunks(chunkUrls, totalSize, threads, signal, onProgress, downloadId, resumeState) {
    var totalChunks = chunkUrls.length;
    var threadCount = threads === 0 ? totalChunks : Math.min(threads || 6, totalChunks);

    var downloaded = new Array(totalChunks);
    var doneMap = {};
    var completed = 0;
    var loaded = 0;

    if (resumeState) {
      if (resumeState.doneChunks) {
        for (var ci = 0; ci < totalChunks; ci++) {
          if (resumeState.doneChunks[ci]) {
            doneMap[ci] = true;
            completed++;
          }
        }
      }
      if (resumeState.loaded) loaded = resumeState.loaded;
    }

    if (onProgress && loaded > 0) {
      onProgress({
        progress: totalSize > 0 ? Math.round(loaded / totalSize * 100) : 0,
        speed: 0, loaded: loaded, total: totalSize,
        chunk: completed, totalChunks: totalChunks, resumed: true
      });
    }

    var startTime = Date.now();
    var aborted = false;
    var self = this;
    var saveCounter = 0;

    var queue = [];
    for (var j = 0; j < totalChunks; j++) {
      if (!doneMap[j]) queue.push({ index: j, url: chunkUrls[j] });
    }

    async function worker() {
      while (true) {
        if (aborted || signal.aborted) return;

        if (self.paused.get(downloadId)) {
          await new Promise(function (resolve) {
            self.pauseCallbacks.set(downloadId, resolve);
          });
          self.pauseCallbacks.delete(downloadId);
          if (aborted || signal.aborted) return;
        }

        if (queue.length === 0) break;
        var task = queue.shift();

        try {
          var response = await fetch(task.url, { signal: signal });
          if (!response.ok) throw new Error('Chunk ' + (task.index + 1) + ' HTTP ' + response.status);
          var buf = await response.arrayBuffer();
          downloaded[task.index] = new Uint8Array(buf);
          doneMap[task.index] = true;
          completed++;
          loaded += buf.byteLength;

          if (onProgress) {
            var elapsed = (Date.now() - startTime) / 1000;
            var speed = elapsed > 0 ? loaded / elapsed : 0;
            var progress = totalSize > 0 ? Math.round(loaded / totalSize * 100) : 100;
            onProgress({ progress: progress, speed: speed, loaded: loaded, total: totalSize, chunk: completed, totalChunks: totalChunks });
          }

          saveCounter++;
          if (saveCounter % 5 === 0) {
            self._saveMeta(downloadId, doneMap, loaded);
          }
        } catch (err) {
          aborted = true;
          throw err;
        }
      }
    }

    var workers = [];
    for (var k = 0; k < threadCount; k++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    if (totalSize > 0 && loaded !== totalSize) {
      throw new Error('Download incomplete: received ' + loaded + ' of ' + totalSize + ' bytes');
    }
    for (var m = 0; m < downloaded.length; m++) {
      if (!downloaded[m]) throw new Error('Chunk ' + (m + 1) + ' missing');
    }

    var blob = new Blob(downloaded);
    return { blob: blob, size: blob.size };
  }

  _saveMeta(downloadId, doneChunks, loaded) {
    ResumeDB.save(downloadId, {
      doneChunks: doneChunks,
      loaded: loaded
    });
  }

  pauseDownload(downloadId) {
    this.paused.set(downloadId, true);
  }

  resumeDownload(downloadId) {
    this.paused.set(downloadId, false);
    var cb = this.pauseCallbacks.get(downloadId);
    if (cb) cb();
  }

  isPaused(downloadId) {
    return !!this.paused.get(downloadId);
  }

  async cancelDownload(downloadId) {
    var ctrl = this.abortControllers.get(downloadId);
    if (ctrl) ctrl.abort();
    this.abortControllers.delete(downloadId);
    this.paused.delete(downloadId);
    this.pauseCallbacks.delete(downloadId);
    await ResumeDB.remove(downloadId);
  }

  cancelAll() {
    var self = this;
    this.abortControllers.forEach(function (ctrl, id) {
      ctrl.abort();
      self.paused.delete(id);
      self.pauseCallbacks.delete(id);
    });
    this.abortControllers.clear();
  }

  static async getResumableDownloads() {
    var states = await ResumeDB.list();
    return states.filter(function (s) { return s.data && s.data.doneChunks; });
  }

  static async checkResumable(filePath) {
    return await ResumeDB.load(filePath);
  }
}

window.ChunkDownloader = ChunkDownloader;
window.ResumeDB = ResumeDB;