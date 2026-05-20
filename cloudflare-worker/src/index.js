export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const githubUrl = url.searchParams.get('url');
    const keyHex = url.searchParams.get('key');

    if (!githubUrl || !keyHex) {
      return new Response('Missing url or key parameter', { status: 400 });
    }

    try {
      // ── Step 1: Fetch encrypted image from GitHub ──────────────────────────
      // Strategy: Use the GitHub Contents API (bypasses Fastly CDN cache entirely)
      // when a GITHUB_PAT secret is configured in the Worker environment.
      // Falls back to raw URL with cache-busting if PAT is unavailable.
      let encryptedBuffer;

      const apiBuffer = env.GITHUB_PAT
        ? await fetchViaGitHubAPI(githubUrl, env.GITHUB_PAT).catch(() => null)
        : null;

      if (apiBuffer) {
        encryptedBuffer = apiBuffer;
      } else {
        // Fallback: cache-bust the raw URL
        const rawUrlObj = new URL(githubUrl);
        rawUrlObj.searchParams.set('cb', Date.now().toString());
        const rawRes = await fetch(rawUrlObj.toString(), {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!rawRes.ok) {
          return new Response('Failed to fetch from GitHub: ' + rawRes.statusText, { status: 502 });
        }
        encryptedBuffer = await rawRes.arrayBuffer();
      }

      // ── Step 2: Parse the buffer ───────────────────────────────────────────
      // Format: [12 bytes IV] + [Ciphertext + Auth Tag]
      if (encryptedBuffer.byteLength < 28) {
        return new Response('Invalid encrypted data format', { status: 400 });
      }

      const encryptedUint8 = new Uint8Array(encryptedBuffer);
      const iv = encryptedUint8.slice(0, 12);

      // In Web Crypto API, the ciphertext and the auth tag are combined.
      // So we just take everything after the 12-byte IV.
      const ciphertextWithTag = encryptedUint8.slice(12);

      // ── Step 3: Convert hex key to CryptoKey ───────────────────────────────
      const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      if (keyBytes.length !== 32) {
        return new Response('Invalid key length', { status: 400 });
      }

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      // ── Step 4: Decrypt using Web Crypto API ───────────────────────────────
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        cryptoKey,
        ciphertextWithTag
      );

      // ── Step 5: Return decrypted image ─────────────────────────────────────
      return new Response(decryptedBuffer, {
        headers: {
          'Content-Type': 'image/png',
          // Prevent caching by intermediaries to ensure the recipient always
          // sees the latest version of the message content.
          'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        }
      });

    } catch (error) {
      console.error('Decryption failed:', error.stack);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

/**
 * Fetch a raw file from GitHub using the Contents API.
 * This bypasses the Fastly CDN cache that raw.githubusercontent.com uses,
 * ensuring deleted/edited messages are always served fresh.
 *
 * @param {string} rawUrl - A raw.githubusercontent.com URL
 * @param {string} pat    - A GitHub Personal Access Token
 * @returns {Promise<ArrayBuffer>}
 */
async function fetchViaGitHubAPI(rawUrl, pat) {
  // raw.githubusercontent.com URL format:
  //   https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
  const match = rawUrl.match(
    /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/
  );
  if (!match) throw new Error('Cannot parse raw GitHub URL');

  const [, owner, repo, ref, filePath] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${ref}`;

  const res = await fetch(apiUrl, {
    headers: {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'email-editor-extension'
    }
  });

  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return await res.arrayBuffer();
}
