import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateRawAgreementToken,
  hashAgreementToken,
  SIGN_TOKEN_TTL_MS,
} from '@/lib/onboarding/agreement-tokens';

describe('Agreement token generation (P1.A.7-b)', () => {
  it('generates a 64-char hex string', () => {
    const token = generateRawAgreementToken();
    assert.equal(token.length, 64);
    assert.match(token, /^[0-9a-f]+$/);
  });

  it('generates unique tokens on each call', () => {
    const t1 = generateRawAgreementToken();
    const t2 = generateRawAgreementToken();
    assert.notEqual(t1, t2);
  });
});

describe('Agreement token hashing (P1.A.7-b)', () => {
  it('produces a deterministic hash', () => {
    const token = 'test-token-value';
    const h1 = hashAgreementToken(token);
    const h2 = hashAgreementToken(token);
    assert.equal(h1, h2);
  });

  it('produces different hashes for different inputs', () => {
    const h1 = hashAgreementToken('token-a');
    const h2 = hashAgreementToken('token-b');
    assert.notEqual(h1, h2);
  });

  it('produces a 64-char hex hash (sha256)', () => {
    const hash = hashAgreementToken('any-input');
    assert.equal(hash.length, 64);
    assert.match(hash, /^[0-9a-f]+$/);
  });
});

describe('Agreement token TTL (P1.A.7-b)', () => {
  it('SIGN_TOKEN_TTL_MS equals 7 days in ms', () => {
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    assert.equal(SIGN_TOKEN_TTL_MS, sevenDaysMs);
  });
});
