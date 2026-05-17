import { describe, it } from "node:test";

// Skipped placeholder tests — document the POST /api/locations contract
// for future integration testing in P0.H. End-to-end testing requires
// NextAuth + Prisma + withTenantScope harness which lives outside unit tests.
// These it.skip() calls deliberately do not count toward the passing-test total.

describe("POST /api/locations input validation (P0.D.3)", () => {
  it.skip("(a) requires name as non-empty trimmed string", () => {});
  it.skip("(b) returns 400 on missing or invalid body", () => {});
  it.skip("(c) creates location with trimmed name on success", () => {});
});
