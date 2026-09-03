const fs = require('fs');
const path = require('path');

function scanDirectory(dirPath, basePath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const children = scanDirectory(fullPath, basePath);
      result.push({
        name: entry.name,
        path: relativePath,
        type: 'folder',
        size: children.reduce((sum, c) => sum + (c.size || 0), 0),
        children: children,
      });
    } else {
      const stat = fs.statSync(fullPath);
      result.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
        size: stat.size,
        lastModified: stat.mtime.toISOString(),
      });
    }
  }

  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

function countFiles(files) {
  let count = 0;
  for (const f of files) {
    if (f.type === 'file') count++;
    else if (f.children) count += countFiles(f.children);
  }
  return count;
}

module.exports = { scanDirectory, countFiles };