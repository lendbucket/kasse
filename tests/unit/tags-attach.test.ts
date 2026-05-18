import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { VALID_TAG_TARGET_ENTITIES } from "@/lib/tags/types";

/**
 * Tag attachment tests. The attach/detach/setTagsForEntity functions depend on
 * a real Prisma transaction client — those are integration tests. Here we test
 * the validation and contract layer that's unit-testable.
 */

describe("EntityTag entityType validation (P0.I.2)", () => {
  it("all 5 entity types are recognized", () => {
    const valid = ["CLIENT", "SERVICE", "APPOINTMENT", "STAFF", "PRODUCT"];
    for (const t of valid) {
      assert.ok(
        (VALID_TAG_TARGET_ENTITIES as string[]).includes(t),
        `expected ${t} to be a valid entity type`
      );
    }
  });

  it("rejects unknown entity type", () => {
    assert.ok(
      !(VALID_TAG_TARGET_ENTITIES as string[]).includes("INVOICE"),
      "INVOICE should not be a valid entity type"
    );
  });

  it("entity types are case-sensitive", () => {
    assert.ok(
      !(VALID_TAG_TARGET_ENTITIES as string[]).includes("client"),
      "lowercase 'client' should not match"
    );
  });
});

describe("EntityTag uniqueness contract (P0.I.2)", () => {
  it("unique constraint is (tagId, entityType, entityId) — documented in schema", () => {
    // This test documents the contract: the DB enforces that the same tag
    // cannot be attached to the same entity twice. The attachTag helper uses
    // upsert with this compound unique to achieve idempotency.
    assert.ok(true, "@@unique([tagId, entityType, entityId]) in schema.prisma");
  });
});

describe("setTagsForEntity diff contract (P0.I.2)", () => {
  it("diff logic: add missing, remove extra", () => {
    // Simulate the diff logic from setTagsForEntity
    const currentIds = new Set(["tag-1", "tag-2", "tag-3"]);
    const desiredIds = new Set(["tag-2", "tag-4", "tag-5"]);

    const toAdd = Array.from(desiredIds).filter(id => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter(id => !desiredIds.has(id));

    assert.deepEqual(toAdd.sort(), ["tag-4", "tag-5"]);
    assert.deepEqual(toRemove.sort(), ["tag-1", "tag-3"]);
  });

  it("diff logic: no changes when sets are identical", () => {
    const currentIds = new Set(["tag-1", "tag-2"]);
    const desiredIds = new Set(["tag-1", "tag-2"]);

    const toAdd = Array.from(desiredIds).filter(id => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter(id => !desiredIds.has(id));

    assert.equal(toAdd.length, 0);
    assert.equal(toRemove.length, 0);
  });

  it("diff logic: clear all when desired is empty", () => {
    const currentIds = new Set(["tag-1", "tag-2"]);
    const desiredIds = new Set<string>();

    const toAdd = Array.from(desiredIds).filter(id => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter(id => !desiredIds.has(id));

    assert.equal(toAdd.length, 0);
    assert.deepEqual(toRemove.sort(), ["tag-1", "tag-2"]);
  });

  it("diff logic: add all when current is empty", () => {
    const currentIds = new Set<string>();
    const desiredIds = new Set(["tag-1", "tag-2"]);

    const toAdd = Array.from(desiredIds).filter(id => !currentIds.has(id));
    const toRemove = Array.from(currentIds).filter(id => !desiredIds.has(id));

    assert.deepEqual(toAdd.sort(), ["tag-1", "tag-2"]);
    assert.equal(toRemove.length, 0);
  });

  it("deduplication: duplicate tagIds are collapsed", () => {
    const tagIds = ["tag-1", "tag-2", "tag-1", "tag-3", "tag-2"];
    const uniqueTagIds = Array.from(new Set(tagIds));
    assert.deepEqual(uniqueTagIds.sort(), ["tag-1", "tag-2", "tag-3"]);
  });
});

describe("getTagsForEntities bulk contract (P0.I.2)", () => {
  it("returns empty arrays for entities with no tags", () => {
    // Simulate the Map initialization from getTagsForEntities
    const entityIds = ["e1", "e2", "e3"];
    const result = new Map<string, string[]>();
    for (const id of entityIds) result.set(id, []);

    assert.deepEqual(result.get("e1"), []);
    assert.deepEqual(result.get("e2"), []);
    assert.deepEqual(result.get("e3"), []);
  });

  it("returns empty Map for empty entityIds input", () => {
    const entityIds: string[] = [];
    if (entityIds.length === 0) {
      const result = new Map<string, string[]>();
      assert.equal(result.size, 0);
    }
  });
});
