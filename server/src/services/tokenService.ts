/**
 * tokenService.ts
 *
 * Signs and verifies JWTs using Ed25519 (EdDSA) asymmetric keys via the
 * `jose` library. This replaces the old HS256 JWT_SECRET with a proper
 * private/public key pair:
 *
 *  - JWT_PRIVATE_KEY  → signs tokens   (server-side secret, never expose)
 *  - JWT_PUBLIC_KEY   → verifies tokens (can be shared with other services)
 *
 * Why Ed25519 over HS256?
 *  • Asymmetric: private key signs, public key verifies — other services can
 *    verify tokens without ever seeing the signing secret.
 *  • Cryptographically stronger: 128-bit security level vs HS256's symmetric key.
 *  • Compact: Ed25519 signatures are 64 bytes vs RSA's 256+ bytes.
 *  • Faster: Ed25519 is ~2x faster than RSA-2048 for sign/verify.
 */

import { SignJWT, jwtVerify, importJWK, KeyLike } from 'jose';
import { TokenPayload } from '../types/index';

let _privateKey: KeyLike | null = null;
let _publicKey: KeyLike | null = null;

async function getPrivateKey(): Promise<KeyLike> {
  if (!_privateKey) {
    const raw = process.env.JWT_PRIVATE_KEY;
    if (!raw) throw new Error('JWT_PRIVATE_KEY is not set in environment.');
    _privateKey = (await importJWK(JSON.parse(raw), 'EdDSA')) as KeyLike;
  }
  return _privateKey;
}

async function getPublicKey(): Promise<KeyLike> {
  if (!_publicKey) {
    const raw = process.env.JWT_PUBLIC_KEY;
    if (!raw) throw new Error('JWT_PUBLIC_KEY is not set in environment.');
    _publicKey = (await importJWK(JSON.parse(raw), 'EdDSA')) as KeyLike;
  }
  return _publicKey;
}

/**
 * Sign a JWT using Ed25519 private key.
 */
export async function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const privateKey = await getPrivateKey();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return new SignJWT({ name: payload.name, email: payload.email })
    .setProtectedHeader({ alg: 'EdDSA' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

/**
 * Verify a JWT using Ed25519 public key.
 * Throws if token is expired, tampered with, or uses wrong algorithm.
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  const publicKey = await getPublicKey();

  const { payload } = await jwtVerify(token, publicKey, {
    algorithms: ['EdDSA'],       // strict: reject anything not EdDSA
  });

  return {
    sub: payload.sub as string,
    name: payload['name'] as string,
    email: payload['email'] as string,
    iat: payload.iat,
    exp: payload.exp,
  };
}
