/**
 * generateKeys.ts
 *
 * Generates an Ed25519 key pair for signing JWTs (EdDSA / ES256 replacement).
 * Ed25519 is a modern elliptic-curve algorithm — far more secure than HS256
 * (symmetric HMAC) and more efficient than RS256.
 *
 * Usage:  npm run generate-keys
 * Output: prints PRIVATE_KEY and PUBLIC_KEY to paste into your .env
 */

import { generateKeyPair, exportJWK } from 'jose';

async function main(): Promise<void> {
  console.log('\n🔐 Generating Ed25519 key pair for JWT signing...\n');

  const { privateKey, publicKey } = await generateKeyPair('EdDSA', {
    crv: 'Ed25519',
    extractable: true,
  });

  // Export as JWK (JSON Web Key) — compact, portable, standard
  const privateJwk = JSON.stringify(await exportJWK(privateKey));
  const publicJwk  = JSON.stringify(await exportJWK(publicKey));

  console.log('Add these two lines to your server/.env:\n');
  console.log('─'.repeat(60));
  console.log(`JWT_PRIVATE_KEY='${privateJwk}'`);
  console.log(`JWT_PUBLIC_KEY='${publicJwk}'`);
  console.log('─'.repeat(60));
  console.log('\n⚠️  Keep JWT_PRIVATE_KEY secret — never commit it to git!');
  console.log('✅  JWT_PUBLIC_KEY is safe to share (used only to verify tokens).\n');
}

main().catch((err) => {
  console.error('Key generation failed:', err);
  process.exit(1);
});
