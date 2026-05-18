import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeFlagBucket } from "@/lib/feature-flags/hash";

describe("computeFlagBucket (P0.H.2)", () => {
  it("returns same value for same input (deterministic)", () => {
    const a = computeFlagBucket("test-flag", "org-123");
    const b = computeFlagBucket("test-flag", "org-123");
    assert.equal(a, b);
  });

  it("returns different values for different orgs", () => {
    const a = computeFlagBucket("test-flag", "org-aaa");
    const b = computeFlagBucket("test-flag", "org-bbb");
    // Technically could collide, but SHA256 makes this astronomically unlikely
    // for two clearly different inputs
    assert.notEqual(a, b);
  });

  it("returns different values for different flag keys (same org)", () => {
    const a = computeFlagBucket("flag-alpha", "org-123");
    const b = computeFlagBucket("flag-beta", "org-123");
    assert.notEqual(a, b);
  });

  it("returns value in [0, 99]", () => {
    for (let i = 0; i < 100; i++) {
      const bucket = computeFlagBucket("range-test", `org-${i}`);
      assert.ok(bucket >= 0, `bucket ${bucket} is below 0`);
      assert.ok(bucket <= 99, `bucket ${bucket} is above 99`);
    }
  });

  it("distribution: 1000 orgs at rollout=50% → expect 400-600 in bucket", () => {
    let count = 0;
    for (let i = 0; i < 1000; i++) {
      const bucket = computeFlagBucket("distribution-test", `org-${i}`);
      if (bucket < 50) count++;
    }
    assert.ok(count >= 400, `Only ${count} orgs in bucket < 50 (expected >= 400)`);
    assert.ok(count <= 600, `${count} orgs in bucket < 50 (expected <= 600)`);
  });
});
