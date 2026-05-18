-- P0.G PR 1 Cycle 2: Add composite unique constraint on StylistSchedule
-- Prevents overlapping schedule rows for the same staff + day + effective start date.
ALTER TABLE "StylistSchedule"
  ADD CONSTRAINT "StylistSchedule_staffId_dayOfWeek_effectiveStartDate_key"
  UNIQUE ("staffId", "dayOfWeek", "effectiveStartDate");
