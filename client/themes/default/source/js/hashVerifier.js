class HashVerifier {
  async sha256(blob) {
    if (!blob || blob.size === 0) {
      throw new Error('Cannot hash empty data');
    }
    // IE 回退：不支持 crypto.subtle，跳过哈希验证
    if (!window.crypto || !window.crypto.subtle || !window.crypto.subtle.digest) {
      console.warn('[HashVerifier] crypto.subtle not available, skipping hash verification');
      return '0'.repeat(64);
    }
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verify(blob, expectedHash) {
    if (!expectedHash) {
      console.warn('[HashVerifier] No expected hash provided, skipping verification');
      return true;
    }
    try {
      const hash = await this.sha256(blob);
      return hash === expectedHash;
    } catch (e) {
      console.error('[HashVerifier] Verification error:', e);
      return false;
    }
  }
}

window.HashVerifier = HashVerifier;