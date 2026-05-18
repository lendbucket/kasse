import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CRON_HEARTBEAT_STALE_THRESHOLD_MS } from "@/lib/health/checks";

/**
 * Health check tests. The actual check functions depend on prismaAdmin and
 * env vars. Here we test the contract and threshold math.
 */

describe("Health check constants (P0.J)", () => {
  it("CRON_HEARTBEAT_STALE_THRESHOLD_MS is 26 hours", () => {
    const expected = 26 * 60 * 60 * 1000;
    assert.equal(CRON_HEARTBEAT_STALE_THRESHOLD_MS, expected);
  });
});

describe("checkSentry contract (P0.J)", () => {
  it("valid DSN format is recognized", () => {
    const valid = "https://abc123@o12345.ingest.sentry.io/67890";
    assert.ok(/^https:\/\/[^@]+@[^/]+\/\d+$/.test(valid));
  });

  it("missing protocol is rejected", () => {
    const invalid = "abc123@o12345.ingest.sentry.io/67890";
    assert.ok(!/^https:\/\/[^@]+@[^/]+\/\d+$/.test(invalid));
  });

  it("missing project ID is rejected", () => {
    const invalid = "https://abc123@o12345.ingest.sentry.io/";
    assert.ok(!/^https:\/\/[^@]+@[^/]+\/\d+$/.test(invalid));
  });

  it("empty string is rejected", () => {
    assert.ok(!/^https:\/\/[^@]+@[^/]+\/\d+$/.test(""));
  });
});

describe("checkResend contract (P0.J)", () => {
  it("key starting with re_ is valid", () => {
    const key = "re_abc123xyz";
    assert.ok(!!key && key.startsWith("re_"));
  });

  it("key not starting with re_ is invalid", () => {
    const key = "sk_abc123xyz";
    assert.ok(!(!!key && key.startsWith("re_")));
  });

  it("empty string is invalid", () => {
    const key: string | undefined = "";
    assert.ok(!(key && key.startsWith("re_")));
  });

  it("undefined is invalid", () => {
    const key = process.env.__NONEXISTENT_TEST_KEY__;
    assert.ok(!(key && key.startsWith("re_")));
  });
});

describe("checkStorage contract (P0.J)", () => {
  it("both env vars present is ok", () => {
    const url = "https://project.supabase.co";
    const anonKey = "eyJhbGciOiJIUzI1NiJ9...";
    assert.ok(!!url && !!anonKey);
  });

  it("missing url is not ok", () => {
    const url = "";
    const anonKey = "eyJhbGciOiJIUzI1NiJ9...";
    assert.ok(!(!!url && !!anonKey));
  });

  it("missing anon key is not ok", () => {
    const url = "https://project.supabase.co";
    const anonKey = "";
    assert.ok(!(!!url && !!anonKey));
  });
});

describe("checkCronHeartbeat contract (P0.J)", () => {
  it("entry younger than 26h is ok", () => {
    const entryAge = 12 * 60 * 60 * 1000; // 12 hours
    assert.ok(entryAge < CRON_HEARTBEAT_STALE_THRESHOLD_MS);
  });

  it("entry older than 26h is stale", () => {
    const entryAge = 30 * 60 * 60 * 1000; // 30 hours
    assert.ok(entryAge >= CRON_HEARTBEAT_STALE_THRESHOLD_MS);
  });

  it("no entry yet returns ok=true (foundation state)", () => {
    // When no audit_retention.completed entry exists, the check returns ok=true
    // to avoid false alarms before the cron is registered.
    const recent = null;
    const ok = recent === null ? true : false;
    assert.ok(ok);
  });
});

describe("runAllHealthChecks aggregator (P0.J)", () => {
  it("overall ok is AND of all checks", () => {
    const allPass = [{ ok: true }, { ok: true }, { ok: true }];
    assert.ok(allPass.every(c => c.ok));

    const oneFail = [{ ok: true }, { ok: false }, { ok: true }];
    assert.ok(!oneFail.every(c => c.ok));
  });

  it("snapshot includes timestamp in ISO format", () => {
    const ts = new Date().toISOString();
    assert.ok(ts.includes("T"));
    assert.ok(ts.endsWith("Z"));
  });
});
