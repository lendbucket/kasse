-- P0.G PR 2 Cycle 2: Rename preAuthPayrocTransactionId to preAuthHoldTxId
-- Processor-agnostic naming — Kasse calls SalonTransact, not Payroc directly.
ALTER TABLE "Appointment" RENAME COLUMN "preAuthPayrocTransactionId" TO "preAuthHoldTxId";
