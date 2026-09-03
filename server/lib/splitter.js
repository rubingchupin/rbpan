const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');

function computeSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function splitFile(inputPath, outputDir, maxChunkSize, chunkExtension) {
  const ext = chunkExtension || 'rbpan';
  const stat = fs.statSync(inputPath);
  const totalSize = stat.size;
  const chunks = Math.ceil(totalSize / maxChunkSize);
  const chunkFiles = [];
  const baseName = path.basename(inputPath);

  const buffer = Buffer.alloc(maxChunkSize);
  const fd = fs.openSync(inputPath, 'r');
  let offset = 0;

  for (let i = 0; i < chunks; i++) {
    const chunkName = `${baseName}.${ext}${i + 1}`;
    const chunkPath = path.join(outputDir, chunkName);
    const remaining = totalSize - offset;
    const readSize = Math.min(maxChunkSize, remaining);

    let bytesRead = 0;
    while (bytesRead < readSize) {
      const result = fs.readSync(fd, buffer, bytesRead, readSize - bytesRead, offset + bytesRead);
      bytesRead += result;
    }

    fs.writeFileSync(chunkPath, buffer.subarray(0, bytesRead));
    chunkFiles.push(chunkName);
    offset += bytesRead;
  }

  fs.closeSync(fd);
  return { chunks, chunkFiles };
}

async function copySmallFile(inputPath, outputDir) {
  const baseName = path.basename(inputPath);
  const destPath = path.join(outputDir, baseName);
  fs.copyFileSync(inputPath, destPath);
  return baseName;
}

module.exports = { computeSha256, splitFile, copySmallFile };