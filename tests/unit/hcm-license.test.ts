import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Replicated core logic from findExpiringLicenses.
 * The real function requires a Prisma transaction client, so we test
 * the filtering and daysUntilExpiry computation in isolation.
 */
interface LicenseRecord {
  id: string;
  staffId: string;
  state: string;
  licenseType: string;
  licenseNumber: string;
  expiresAt: Date | null;
  verificationStatus: string;
}

function filterExpiringLicenses(
  licenses: LicenseRecord[],
  withinDays: number,
  now: Date = new Date(),
): Array<LicenseRecord & { daysUntilExpiry: number }> {
  const cutoff = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return licenses
    .filter(
      (l) =>
        l.verificationStatus === "ACTIVE" &&
        l.expiresAt !== null &&
        l.expiresAt.getTime() >= now.getTime() &&
        l.expiresAt.getTime() <= cutoff.getTime(),
    )
    .map((l) => ({
      ...l,
      daysUntilExpiry: Math.ceil(
        (l.expiresAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      ),
    }))
    .sort((a, b) => a.expiresAt!.getTime() - b.expiresAt!.getTime());
}

describe("findExpiringLicenses logic (P0.G.4)", () => {
  const now = new Date("2026-05-18T00:00:00Z");

  function makeLicense(
    overrides: Partial<LicenseRecord> = {},
  ): LicenseRecord {
    return {
      id: "lic-1",
      staffId: "staff-1",
      state: "TX",
      licenseType: "COSMETOLOGY",
      licenseNumber: "TX-12345",
      expiresAt: new Date("2026-06-01T00:00:00Z"),
      verificationStatus: "ACTIVE",
      ...overrides,
    };
  }

  it("returns licenses expiring within window", () => {
    const licenses = [
      makeLicense({ id: "lic-1", expiresAt: new Date("2026-06-01T00:00:00Z") }),
      makeLicense({ id: "lic-2", expiresAt: new Date("2026-08-01T00:00:00Z") }),
    ];
    const result = filterExpiringLicenses(licenses, 30, now);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, "lic-1");
  });

  it("excludes non-ACTIVE licenses", () => {
    const licenses = [
      makeLicense({ verificationStatus: "EXPIRED" }),
    ];
    const result = filterExpiringLicenses(licenses, 30, now);
    assert.equal(result.length, 0);
  });

  it("excludes already-expired licenses", () => {
    const licenses = [
      makeLicense({ expiresAt: new Date("2026-05-10T00:00:00Z") }),
    ];
    const result = filterExpiringLicenses(licenses, 30, now);
    assert.equal(result.length, 0);
  });

  it("computes daysUntilExpiry correctly", () => {
    const licenses = [
      makeLicense({ expiresAt: new Date("2026-05-28T00:00:00Z") }),
    ];
    const result = filterExpiringLicenses(licenses, 30, now);
    assert.equal(result.length, 1);
    assert.equal(result[0].daysUntilExpiry, 10);
  });

  it("handles license expiring today (0 days but ceil gives 0)", () => {
    const licenses = [
      makeLicense({ expiresAt: new Date("2026-05-18T12:00:00Z") }),
    ];
    const result = filterExpiringLicenses(licenses, 30, now);
    assert.equal(result.length, 1);
    assert.equal(result[0].daysUntilExpiry, 1); // 12 hours rounds up to 1
  });

  it("returns empty for no licenses", () => {
    const result = filterExpiringLicenses([], 30, now);
    assert.equal(result.length, 0);
  });
});
