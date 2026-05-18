-- P0.G PR 3 Cycle 2: Idempotency keys + index improvements
-- Applied via Supabase MCP migration "p0g_pr3_cycle2_payment_refund_idempotency"

-- FIX 5: Idempotency keys on Payment and Refund
ALTER TABLE "Payment" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Refund" ADD COLUMN "idempotencyKey" TEXT;

CREATE INDEX "idx_payment_idem_org" ON "Payment"("organizationId", "idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;
CREATE INDEX "idx_refund_idem_org" ON "Refund"("organizationId", "idempotencyKey")
  WHERE "idempotencyKey" IS NOT NULL;

-- FIX 8: Replace compound DevicePairing index with 3 single-column indexes
DROP INDEX IF EXISTS "idx_pairing_devices";
CREATE INDEX "idx_pairing_customer_display" ON "DevicePairing"("customerDisplayDeviceId");
CREATE INDEX "idx_pairing_stylist" ON "DevicePairing"("stylistDeviceId");
CREATE INDEX "idx_pairing_terminal" ON "DevicePairing"("terminalDeviceId");
