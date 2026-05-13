# PII & Sensitive Data Encryption — Architecture Decision

**Status:** LOCKED (2026-05-13)
**Owner:** Robert Reyna, CEO Reyna Tech LLC
**Supersedes:** none (initial spec)
**Implements:** SD-K-008 (KASSE_STRATEGIC_DECISIONS.md) requirement for encrypted PII at rest

## Summary

Banking fields and identity fields on the Organization table will be handled by DIFFERENT mechanisms:

- **Banking fields** (account number, routing number, account holder name, account type, funding speed) → **Payroc bank account tokenization**. We store a token; Payroc holds the underlying PII in their PCI-certified vault.
- **Identity fields** (owner SSN-last-4, EIN, owner DOB) → **AWS KMS application-layer envelope encryption**. We encrypt before write, decrypt only when needed for KYC review.
- **HIPAA / medical fields** (future: formSubmissions.data containing medical notes, formula history, allergies) → **Same as identity fields: AWS KMS envelope encryption**.

This is a hybrid architecture that uses the right tool for each data class. Banking PII benefits from full tokenization (we don't store any underlying data, just an opaque reference). Identity PII can't be tokenized (Payroc doesn't vault identity info — they vault payment instruments) so it gets encrypted at the column level.

## The decision in plain terms

We considered three architectures during Phase 0.6-a planning:

1. **All-encryption via AWS KMS** — encrypt every sensitive field with envelope encryption. Industry standard. Costs ~$5-15/mo, adds KMS as a network dependency.

2. **All-database via pgcrypto** — use Postgres pgcrypto extension with a master key stored in a Postgres GUC. Cheap but the key-storage question creates a credential consolidation problem.

3. **All-tokenization via Payroc** — only works for banking fields, since Payroc doesn't vault identity PII.

Matt Perry (Payroc engineering) confirmed on 2026-05-13 that Payroc's API does support bank account tokenization for ACH push, and the existing UAT processing terminal (6535001) is already provisioned. This unlocks a hybrid architecture: tokenize what Payroc supports, encrypt what they don't.

## Why hybrid wins

Three reasons:

1. **Banking via Payroc → zero plaintext liability for the most sensitive class.** Account numbers and routing numbers are the highest-value target for an attacker. By storing only opaque tokens, a database leak yields zero usable bank credentials. This is strictly better than encrypting them in our database — encryption can be defeated by key compromise; tokenization can't be defeated by ANY database compromise.

2. **Identity via KMS → reuses a well-understood pattern.** SSN-last-4, EIN, owner DOB are needed for KYC submission during onboarding. KMS envelope encryption with a per-row data encryption key (DEK) is the standard pattern. Stripe, Square, every fintech does this.

3. **HIPAA via KMS → forward-compatible with vertical expansion.** SD-K-008 names HIPAA-adjacent fields (medical notes, formula history, allergies) for the med spa vertical. KMS encryption for identity fields means we have the encryption infrastructure ready when those fields land.

## What we are NOT doing (and why)

- We are NOT building a custom encryption service. Reinventing AWS KMS or HashiCorp Vault is a classic founder mistake. Use the managed service.

- We are NOT using pgcrypto. The master-key-storage question is unresolved on Supabase managed Postgres. Either the key sits in a Postgres GUC accessible to anyone with DB superuser access (bad), or we fetch it from KMS at session start (Architecture 1 with extra steps).

- We are NOT encrypting banking fields ourselves. Payroc already does this better than we ever could — they have PCI Level 1 certification, a vault audit trail, hardware security modules. Trying to compete with their vault security is unwise.

- We are NOT planning to read decrypted PII from the dashboard. Identity fields are read ONLY in two contexts: (a) at onboarding submission, when the data flows into the application email (already redacted as of 0.6-a), and (b) at KYC review by superadmin, via the Phase 0.6-e Admin Application Detail viewer. Anywhere else that wants to display these fields uses the redaction helpers in lib/redact.ts.

## Open implementation questions (to be resolved before 0.6-c starts)

Asked Matt at Payroc (2026-05-13 mid-morning) and awaiting response:

1. Which Payroc API endpoint vaults a bank account and returns a token?
2. Bank token format: prefix, length, lifetime, MID-scoping behavior?
3. ACH push request shape — what fields beyond the token? Same shape for Kasse vs SalonTransact?

AWS KMS setup (no external dependency on Matt):

4. Create AWS account for KMS (if Robert doesn't already have one for Reyna Tech LLC).
5. Create a KMS Customer Master Key (CMK) for Kasse production. Region: us-east-2 (matches Supabase).
6. Decide envelope-encryption strategy: per-org DEK vs single CMK direct-encrypt for all rows? Per-org DEK is more standard but adds complexity. For a per-tenant SaaS at our scale (target 100-500 merchants in year 1), single-CMK with all rows encrypted under a single context tag is acceptable; we can migrate to per-org DEK later if needed.
7. KMS key permissions: who can use it? IAM role for the Vercel deployment (via env var injection of AWS credentials). Robert as CEO has full key admin. No one else has decrypt permissions until staff hire.

Open code/integration questions:

8. Where does the AES-GCM IV (nonce) go per-row? Same column as the ciphertext (prefix bytes) is standard.
9. How do we handle the migration from the existing 7 production orgs (all currently have NULL banking/identity fields — verified 2026-05-12 cleanup)? Answer: NO MIGRATION NEEDED. Encrypt-on-write only for new data starting at Phase 0.6-c deployment.
10. Local development: will the encryption layer hit AWS KMS from a local dev environment? Need a strategy — either a separate local-KMS key, or a "passthrough" mode for local dev that doesn't actually encrypt (and a test that catches if passthrough leaks to production).

## Phase 0.6 status (updated)

| Sub-phase | What | Status |
|-----------|------|--------|
| 0.6-a | Redact banking PII in application submission email | Complete (2026-05-12) |
| 0.6-b | Architecture decision: hybrid Payroc tokenization + KMS encryption | Complete (this PR) |
| 0.6-c | Implementation: Payroc bank token integration | Pending (awaiting Matt's API details) |
| 0.6-d | Implementation: KMS envelope encryption for identity fields | Pending (awaiting Robert's AWS account setup) |
| 0.6-e | Admin Application Detail viewer with gated access | Pending |
| 0.6-f | Audit logging for all decryption operations | Pending |

## What changes in the data model (Phase 0.6-c preview)

Current Organization fields:
  bankAccountHolder      String?  (plaintext)
  bankRoutingNumber      String?  (plaintext)
  bankAccountNumber      String?  (plaintext)
  bankAccountType        String?  (plaintext, low sensitivity)
  bankFundingSpeed       String?  (plaintext, low sensitivity)

Target Organization fields (Phase 0.6-c):
  payrocBankTokenId      String?  (opaque token from Payroc vault — replaces all 5 above)

Current Organization fields (identity):
  ownerSsnLast4          String?  (plaintext)
  ein                    String?  (plaintext)
  ownerDob               String?  (plaintext)

Target Organization fields (Phase 0.6-d):
  ownerSsnLast4_encrypted    Bytes?   (KMS envelope-encrypted, AES-256-GCM)
  ein_encrypted              Bytes?   (KMS envelope-encrypted)
  ownerDob_encrypted         Bytes?   (KMS envelope-encrypted)

The pre-encryption column names will be dropped via migration. There are NO rows in production with banking or identity data (verified 2026-05-12), so the migration is schema-only with no data migration step.

## Rollback considerations

If we discover post-implementation that Payroc tokenization has a fatal flaw we didn't see:
- The token approach is reversible: we'd add back banking columns, ask Payroc to detokenize each row (they support detokenization for legitimate operational reasons), repopulate, then drop the token column.
- This is a one-time hour-long operation per merchant, not a permanent lock-in.

If we discover post-implementation that KMS encryption has a fatal flaw:
- We can rotate the master key (KMS supports key rotation natively).
- We can re-encrypt under a new key without downtime if we have the rotation procedure documented.

## Reviewer notes

This is a DECISION doc, not an IMPLEMENTATION doc. Code-level review is not applicable here. The reviewer should evaluate:
- Is the trade-off analysis honest? (Did we miss an architecture?)
- Are the open questions the right ones? (Have we identified the unknowns?)
- Is the migration path clean? (Have we set ourselves up for an easy implementation?)

Code-level review will happen on PR(s) #6-c when the implementation lands.
