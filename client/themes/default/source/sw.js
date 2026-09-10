const STREAM_PREFIX = '/__rbpan_stream/';
const streams = new Map();
const chunkCache = new Map();

self.addEventListener('message', (e) => {
  if (e.data.type === 'rbpan-stream-init') {
    streams.set(e.data.id, {
      chunkUrls: e.data.chunkUrls,
      maxChunkSize: e.data.maxChunkSize,
      totalSize: e.data.totalSize,
      mime: e.data.mime,
    });
    chunkCache.set(e.data.id, {});
  }
  if (e.data.type === 'rbpan-stream-close') {
    streams.delete(e.data.id);
    chunkCache.delete(e.data.id);
  }
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (!url.pathname.startsWith(STREAM_PREFIX)) return;
  const id = url.pathname.slice(STREAM_PREFIX.length);
  const info = streams.get(id);
  if (!info) return;
  e.respondWith(handleStream(e.request, info, id));
});

async function handleStream(req, info, id) {
  const { chunkUrls, maxChunkSize, totalSize, mime } = info;
  const cache = chunkCache.get(id) || {};

  let rangeStart = 0;
  let rangeEnd = totalSize - 1;
  const rangeHeader = req.headers.get('Range');

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      rangeStart = parseInt(match[1], 10) || 0;
      rangeEnd = match[2] ? parseInt(match[2], 10) : totalSize - 1;
    }
  }

  const contentLength = rangeEnd - rangeStart + 1;
  const startChunk = Math.floor(rangeStart / maxChunkSize);
  const endChunk = Math.floor(rangeEnd / maxChunkSize);

  let body = null;

  if (rangeStart === 0 && rangeEnd === totalSize - 1) {
    body = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < chunkUrls.length; i++) {
          let buf = cache[i];
          if (!buf) {
            const resp = await fetch(chunkUrls[i]);
            buf = await resp.arrayBuffer();
            cache[i] = buf;
          }
          controller.enqueue(new Uint8Array(buf));
        }
        controller.close();
      }
    });
  } else {
    body = new ReadableStream({
      async start(controller) {
        for (let i = startChunk; i <= endChunk && i < chunkUrls.length; i++) {
          let buf = cache[i];
          if (!buf) {
            const resp = await fetch(chunkUrls[i]);
            buf = await resp.arrayBuffer();
            cache[i] = buf;
          }
          const chunkStart = i * maxChunkSize;
          const chunkEnd = Math.min(chunkStart + maxChunkSize - 1, totalSize - 1);
          const byteStart = Math.max(rangeStart - chunkStart, 0);
          const byteEnd = Math.min(rangeEnd - chunkStart, chunkEnd - chunkStart);
          controller.enqueue(new Uint8Array(buf.slice(byteStart, byteEnd + 1)));
        }
        controller.close();
      }
    });
  }

  const headers = {
    'Content-Type': mime,
    'Content-Length': String(contentLength),
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
  };

  if (rangeHeader) {
    headers['Content-Range'] = 'bytes ' + rangeStart + '-' + rangeEnd + '/' + totalSize;
    return new Response(body, { status: 206, statusText: 'Partial Content', headers });
  }

  return new Response(body, { status: 200, headers });
}