const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');

function computeSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath, { highWaterMark: 16 * 1024 });
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function processFile(inputPath, outputDir, maxChunkSize, chunkExtension) {
  const ext = chunkExtension || 'rbpan';
  const stat = fs.statSync(inputPath);
  const totalSize = stat.size;
  const baseName = path.basename(inputPath);

  if (totalSize <= maxChunkSize) {
    const hash = crypto.createHash('sha256');
    const destPath = path.join(outputDir, baseName);
    const writeStream = fs.createWriteStream(destPath);
    const readStream = fs.createReadStream(inputPath, { highWaterMark: 16 * 1024 });

    readStream.on('data', (chunk) => hash.update(chunk));
    await pipeline(readStream, writeStream);
    return { sha256: hash.digest('hex'), chunks: 1, chunkFiles: [baseName] };
  }

  const hash = crypto.createHash('sha256');
  const readStream = fs.createReadStream(inputPath, { highWaterMark: 16 * 1024 });
  const chunkFiles = [];
  let chunkIdx = 0;
  let chunkOff = 0;
  let chunkBuf = Buffer.allocUnsafe(maxChunkSize);
  let writeQueue = Promise.resolve();

  async function flush() {
    const idx = chunkIdx;
    const buf = chunkBuf.subarray(0, chunkOff);
    const name = `${baseName}.${ext}${idx + 1}`;
    chunkFiles.push(name);
    const target = path.join(outputDir, name);
    writeQueue = writeQueue.then(() => fs.promises.writeFile(target, buf));
    chunkIdx++;
    chunkOff = 0;
    await writeQueue;
    chunkBuf = Buffer.allocUnsafe(maxChunkSize);
  }

  readStream.on('error', (err) => { throw err; });

  for await (const data of readStream) {
    hash.update(data);
    let remaining = data;
    while (remaining.length > 0) {
      const space = maxChunkSize - chunkOff;
      const take = Math.min(remaining.length, space);
      remaining.copy(chunkBuf, chunkOff, 0, take);
      chunkOff += take;
      remaining = remaining.subarray(take);
      if (chunkOff >= maxChunkSize) await flush();
    }
  }

  if (chunkOff > 0) await flush();
  await writeQueue;

  return { sha256: hash.digest('hex'), chunks: chunkFiles.length, chunkFiles };
}

module.exports = { computeSha256, processFile };