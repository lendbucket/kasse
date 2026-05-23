-- CreateTable
CREATE TABLE "TermsVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "termsContentUrl" TEXT NOT NULL,
    "privacyContentUrl" TEXT NOT NULL,
    "termsBodyHash" TEXT NOT NULL,
    "privacyBodyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "termsVersionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TermsVersion_version_key" ON "TermsVersion"("version");

-- CreateIndex
CREATE INDEX "TermsVersion_effectiveAt_idx" ON "TermsVersion"("effectiveAt");

-- CreateIndex
CREATE INDEX "TermsAcceptance_userId_idx" ON "TermsAcceptance"("userId");

-- CreateIndex
CREATE INDEX "TermsAcceptance_termsVersionId_idx" ON "TermsAcceptance"("termsVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "TermsAcceptance_userId_termsVersionId_key" ON "TermsAcceptance"("userId", "termsVersionId");

-- AddForeignKey
ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermsAcceptance" ADD CONSTRAINT "TermsAcceptance_termsVersionId_fkey" FOREIGN KEY ("termsVersionId") REFERENCES "TermsVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed initial Terms version 1.0.0 with placeholder content URLs.
-- termsBodyHash and privacyBodyHash are SHA-256 of the placeholder
-- "Coming soon" text rendered by /terms and /privacy stub pages.
-- These hashes will change when real attorney-drafted documents land.
INSERT INTO "TermsVersion" (id, version, "effectiveAt", "termsContentUrl", "privacyContentUrl", "termsBodyHash", "privacyBodyHash", "createdAt")
VALUES (
  'tv_initial_v1_0_0',
  '1.0.0',
  NOW(),
  '/terms',
  '/privacy',
  'PLACEHOLDER_TOS_HASH_AWAITING_ATTORNEY_DRAFT',
  'PLACEHOLDER_PRIVACY_HASH_AWAITING_ATTORNEY_DRAFT',
  NOW()
);
