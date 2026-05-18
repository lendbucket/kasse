import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { resolveStylistAvailability } from "@/lib/scheduling/availability";

function makeTime(hours: number, minutes: number): Date {
  // TIME fields come back as Date with UTC time
  const d = new Date("1970-01-01T00:00:00.000Z");
  d.setUTCHours(hours, minutes, 0, 0);
  return d;
}

function makeMockTx(opts: {
  exception?: {
    isWorking: boolean;
    startTime: Date | null;
    endTime: Date | null;
  } | null;
  schedule?: {
    isWorking: boolean;
    startTime: Date;
    endTime: Date;
    effectiveStartDate: Date;
    effectiveEndDate: Date | null;
  } | null;
}) {
  return {
    stylistScheduleException: {
      findUnique: mock.fn(async () => opts.exception ?? null),
    },
    stylistSchedule: {
      findFirst: mock.fn(async () => opts.schedule ?? null),
    },
  } as unknown as Parameters<typeof resolveStylistAvailability>[0];
}

describe("resolveStylistAvailability (P0.G.1)", () => {
  const monday = new Date("2026-05-18T00:00:00.000Z"); // Monday

  it("exception with isWorking=true overrides schedule", async () => {
    const tx = makeMockTx({
      exception: {
        isWorking: true,
        startTime: makeTime(10, 0),
        endTime: makeTime(14, 0),
      },
    });
    const result = await resolveStylistAvailability(tx, {
      staffId: "s1",
      date: monday,
    });
    assert.equal(result.isWorking, true);
    assert.equal(result.startTime, "10:00");
    assert.equal(result.endTime, "14:00");
    assert.equal(result.source, "EXCEPTION");
  });

  it("exception with isWorking=false overrides schedule", async () => {
    const tx = makeMockTx({
      exception: {
        isWorking: false,
        startTime: null,
        endTime: null,
      },
    });
    const result = await resolveStylistAvailability(tx, {
      staffId: "s1",
      date: monday,
    });
    assert.equal(result.isWorking, false);
    assert.equal(result.startTime, null);
    assert.equal(result.endTime, null);
    assert.equal(result.source, "EXCEPTION");
  });

  it("falls back to weekly schedule when no exception", async () => {
    const tx = makeMockTx({
      exception: null,
      schedule: {
        isWorking: true,
        startTime: makeTime(9, 0),
        endTime: makeTime(17, 0),
        effectiveStartDate: new Date("2026-01-01"),
        effectiveEndDate: null,
      },
    });
    const result = await resolveStylistAvailability(tx, {
      staffId: "s1",
      date: monday,
    });
    assert.equal(result.isWorking, true);
    assert.equal(result.startTime, "09:00");
    assert.equal(result.endTime, "17:00");
    assert.equal(result.source, "SCHEDULE");
  });

  it("returns NONE when no schedule and no exception", async () => {
    const tx = makeMockTx({ exception: null, schedule: null });
    const result = await resolveStylistAvailability(tx, {
      staffId: "s1",
      date: monday,
    });
    assert.equal(result.isWorking, false);
    assert.equal(result.startTime, null);
    assert.equal(result.endTime, null);
    assert.equal(result.source, "NONE");
  });

  it("returns correct date string", async () => {
    const tx = makeMockTx({ exception: null, schedule: null });
    const result = await resolveStylistAvailability(tx, {
      staffId: "s1",
      date: new Date("2026-06-15T14:30:00.000Z"),
    });
    assert.equal(result.date, "2026-06-15");
  });
});
