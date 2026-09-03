class HashVerifier {
  async sha256(blob) {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verify(blob, expectedHash) {
    const hash = await this.sha256(blob);
    return hash === expectedHash;
  }
}

window.HashVerifier = HashVerifier;