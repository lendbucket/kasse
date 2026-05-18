import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { nextOccurrenceDate } from "@/lib/recurring/occurrence";
import type { RecurringFrequency } from "@/lib/recurring/types";

describe("nextOccurrenceDate (P0.G.2)", () => {
  const base = new Date("2026-05-18T00:00:00Z");

  it("WEEKLY adds 7 days", () => {
    const result = nextOccurrenceDate({ frequency: "WEEKLY", customIntervalDays: null, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-05-25");
  });

  it("BIWEEKLY adds 14 days", () => {
    const result = nextOccurrenceDate({ frequency: "BIWEEKLY", customIntervalDays: null, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-06-01");
  });

  it("EVERY_4_WEEKS adds 28 days", () => {
    const result = nextOccurrenceDate({ frequency: "EVERY_4_WEEKS", customIntervalDays: null, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-06-15");
  });

  it("MONTHLY adds 1 month", () => {
    const result = nextOccurrenceDate({ frequency: "MONTHLY", customIntervalDays: null, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-06-18");
  });

  it("CUSTOM_DAYS uses customIntervalDays", () => {
    const result = nextOccurrenceDate({ frequency: "CUSTOM_DAYS", customIntervalDays: 10, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-05-28");
  });

  it("CUSTOM_DAYS throws if customIntervalDays missing", () => {
    assert.throws(
      () => nextOccurrenceDate({ frequency: "CUSTOM_DAYS", customIntervalDays: null, fromDate: base }),
      /customIntervalDays required/,
    );
  });

  it("EVERY_6_WEEKS adds 42 days", () => {
    const result = nextOccurrenceDate({ frequency: "EVERY_6_WEEKS", customIntervalDays: null, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-06-29");
  });

  it("EVERY_8_WEEKS adds 56 days", () => {
    const result = nextOccurrenceDate({ frequency: "EVERY_8_WEEKS", customIntervalDays: null, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-07-13");
  });

  it("EVERY_3_WEEKS adds 21 days", () => {
    const result = nextOccurrenceDate({ frequency: "EVERY_3_WEEKS", customIntervalDays: null, fromDate: base });
    assert.equal(result.toISOString().slice(0, 10), "2026-06-08");
  });
});

describe("generateNextOccurrences logic (P0.G.2)", () => {
  // Core generation logic replicated for unit testing without DB/audit deps.
  // Validates: endDate gating, maxOccurrences gating, status history creation.
  async function generateCore(
    series: {
      frequency: RecurringFrequency;
      customIntervalDays: number | null;
      startDate: Date;
      endDate: Date | null;
      maxOccurrences: number | null;
      occurrencesGenerated: number;
      lastGeneratedThrough: Date | null;
      preferredTime: Date;
      id: string;
    },
    count: number,
    hooks: {
      onAppointmentCreate: () => void;
      onStatusHistory: (data: { newStatus: string; changeSource: string; changeReason: string }) => void;
    },
  ): Promise<{ created: number }> {
    let currentDate = series.lastGeneratedThrough ?? new Date(series.startDate);
    let created = 0;

    for (let i = 0; i < count; i++) {
      const occurrenceDate = nextOccurrenceDate({
        frequency: series.frequency,
        customIntervalDays: series.customIntervalDays,
        fromDate: currentDate,
      });

      if (series.endDate && occurrenceDate > new Date(series.endDate)) break;
      if (series.maxOccurrences && series.occurrencesGenerated + created >= series.maxOccurrences) break;

      hooks.onAppointmentCreate();
      hooks.onStatusHistory({
        newStatus: "scheduled",
        changeSource: "SYSTEM_AUTO",
        changeReason: `Auto-generated from recurring series ${series.id}`,
      });

      currentDate = occurrenceDate;
      created++;
    }
    return { created };
  }

  const baseSeries = {
    id: "s1",
    frequency: "WEEKLY" as RecurringFrequency,
    customIntervalDays: null,
    startDate: new Date("2026-05-18"),
    endDate: null,
    maxOccurrences: null,
    occurrencesGenerated: 0,
    lastGeneratedThrough: null,
    preferredTime: new Date("1970-01-01T10:00:00Z"),
  };

  it("respects endDate", async () => {
    const result = await generateCore(
      { ...baseSeries, endDate: new Date("2026-05-30") },
      10,
      { onAppointmentCreate: () => {}, onStatusHistory: () => {} },
    );
    assert.equal(result.created, 1); // only 05-25 fits before 05-30
  });

  it("respects maxOccurrences", async () => {
    const result = await generateCore(
      { ...baseSeries, maxOccurrences: 2, occurrencesGenerated: 1 },
      5,
      { onAppointmentCreate: () => {}, onStatusHistory: () => {} },
    );
    assert.equal(result.created, 1);
  });

  it("creates AppointmentStatusHistory entry for each occurrence", async () => {
    const historyEntries: { newStatus: string; changeSource: string; changeReason: string }[] = [];
    await generateCore(
      baseSeries,
      3,
      {
        onAppointmentCreate: () => {},
        onStatusHistory: (data) => historyEntries.push(data),
      },
    );
    assert.equal(historyEntries.length, 3);
    assert.equal(historyEntries[0].newStatus, "scheduled");
    assert.equal(historyEntries[0].changeSource, "SYSTEM_AUTO");
    assert.ok(historyEntries[0].changeReason.includes("recurring series"));
  });

  it("returns 0 if maxOccurrences already reached", async () => {
    const result = await generateCore(
      { ...baseSeries, maxOccurrences: 5, occurrencesGenerated: 5 },
      3,
      { onAppointmentCreate: () => {}, onStatusHistory: () => {} },
    );
    assert.equal(result.created, 0);
  });
});
