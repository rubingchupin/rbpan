class ChunkDownloader {
  constructor() {
    this.activeDownloads = new Map();
    this.abortControllers = new Map();
  }

  async downloadFile(fileInfo, baseUrl, chunkExtension, threads, onProgress) {
    const downloadId = Date.now().toString();
    const abortController = new AbortController();
    this.abortControllers.set(downloadId, abortController);

    try {
      const chunks = fileInfo.chunks || 1;
      const totalSize = fileInfo.size;

      if (chunks === 1) {
        const fileUrl = this.buildUrl(baseUrl, fileInfo.path);
        const result = await this.downloadSingle(
          fileUrl, totalSize, abortController.signal, onProgress, downloadId
        );
        this.abortControllers.delete(downloadId);
        return result;
      }

      const chunkUrls = this.buildChunkUrls(baseUrl, fileInfo, chunkExtension);
      const result = await this.downloadChunks(
        chunkUrls, totalSize, threads, abortController.signal, onProgress, downloadId
      );
      this.abortControllers.delete(downloadId);
      return result;
    } catch (err) {
      this.abortControllers.delete(downloadId);
      throw err;
    }
  }

  buildUrl(baseUrl, filePath) {
    const base = baseUrl.replace(/\/+$/, '');
    return base + '/' + filePath;
  }

  buildChunkUrls(baseUrl, fileInfo, chunkExtension) {
    const ext = chunkExtension || 'rbpan';
    const dirPath = fileInfo.path.substring(0, fileInfo.path.lastIndexOf('/') + 1);
    const base = baseUrl.replace(/\/+$/, '');
    return fileInfo.files.map(f => base + '/' + dirPath + f);
  }

  async downloadSingle(url, totalSize, signal, onProgress, downloadId) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    const startTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;

      if (onProgress) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? loaded / elapsed : 0;
        const progress = Math.round((loaded / totalSize) * 100);
        onProgress({ progress, speed, loaded, total: totalSize });
      }
    }

    if (loaded !== totalSize) {
      throw new Error(`Download incomplete: received ${loaded} of ${totalSize} bytes`);
    }

    const blob = new Blob(chunks);
    return { blob, size: blob.size };
  }

  async downloadChunks(chunkUrls, totalSize, threads, signal, onProgress, downloadId) {
    const totalChunks = chunkUrls.length;
    const threadCount = Math.min(threads || 6, totalChunks);
    const downloaded = new Array(totalChunks);
    let completed = 0;
    let loaded = 0;
    const startTime = Date.now();
    const queue = chunkUrls.map((url, i) => ({ index: i, url }));

    async function worker() {
      while (queue.length > 0) {
        if (signal.aborted) throw new Error('Aborted');
        const task = queue.shift();
        const response = await fetch(task.url, { signal });
        if (!response.ok) throw new Error('Chunk ' + (task.index + 1) + ' HTTP ' + response.status);
        const buf = await response.arrayBuffer();
        downloaded[task.index] = new Uint8Array(buf);
        completed++;
        loaded += buf.byteLength;

        if (onProgress) {
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? loaded / elapsed : 0;
          const progress = Math.round((loaded / totalSize) * 100);
          onProgress({ progress, speed, loaded, total: totalSize, chunk: completed, totalChunks });
        }
      }
    }

    const workers = [];
    for (let i = 0; i < threadCount; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    if (loaded !== totalSize) {
      throw new Error(`Download incomplete: received ${loaded} of ${totalSize} bytes`);
    }

    const merged = new Uint8Array(totalSize);
    let offset = 0;
    for (let i = 0; i < downloaded.length; i++) {
      if (!downloaded[i]) throw new Error('Chunk ' + (i + 1) + ' missing');
      merged.set(downloaded[i], offset);
      offset += downloaded[i].length;
    }

    const blob = new Blob([merged]);
    return { blob, size: blob.size };
  }

  cancelAll() {
    this.abortControllers.forEach((ctrl, id) => {
      ctrl.abort();
    });
    this.abortControllers.clear();
  }
}

window.ChunkDownloader = ChunkDownloader;