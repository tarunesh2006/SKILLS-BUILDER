/**
 * Verifies a Google ID token (the credential the "Sign in with Google" button
 * returns) without any external library: fetch Google's public keys, check the
 * RS256 signature, then validate the standard claims.
 */
const crypto = require('crypto');
const config = require('../config');

const CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com']);

let certsCache = { keys: [], fetchedAt: 0 };

async function getCerts() {
  if (Date.now() - certsCache.fetchedAt < 60 * 60 * 1000 && certsCache.keys.length) {
    return certsCache.keys;
  }
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`Could not fetch Google certs (${res.status})`);
  const body = await res.json();
  certsCache = { keys: body.keys || [], fetchedAt: Date.now() };
  return certsCache.keys;
}

/** Returns { sub, email, emailVerified, name, picture } or throws. */
async function verifyIdToken(idToken) {
  if (!config.google.clientId) {
    const e = new Error('Google sign-in is not configured on the server');
    e.status = 501;
    throw e;
  }
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [h64, p64, s64] = parts;

  const header = JSON.parse(Buffer.from(h64, 'base64url').toString());
  const payload = JSON.parse(Buffer.from(p64, 'base64url').toString());

  const keys = await getCerts();
  const jwk = keys.find((k) => k.kid === header.kid && k.alg === (header.alg || 'RS256'));
  if (!jwk) throw new Error('Unknown signing key');

  const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${h64}.${p64}`),
    pub,
    Buffer.from(s64, 'base64url'),
  );
  if (!ok) throw new Error('Bad signature');

  if (!ISSUERS.has(payload.iss)) throw new Error('Wrong issuer');
  if (payload.aud !== config.google.clientId) throw new Error('Token was not issued for this app');
  if (payload.exp * 1000 < Date.now()) throw new Error('Token expired');
  if (payload.email_verified !== true && payload.email_verified !== 'true') {
    throw new Error('Google account email is not verified');
  }

  return {
    sub: payload.sub,
    email: String(payload.email || '').toLowerCase(),
    emailVerified: true,
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };
}

module.exports = { verifyIdToken };
