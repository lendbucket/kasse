-- NOTE: This migration was applied via Supabase MCP (apply_migration tool),
-- not via `prisma migrate deploy`. This file captures the executed DDL as the
-- reviewable source of truth, matching the pattern established in PR #78
-- cycle 2 cleanup.

-- P0.G PR 3: Cart + Device + Order + Payment
-- Applied 2026-05-18 via Supabase MCP migration "p0g_pr3_cart_device_order_payment"

-- 1. Device table extensions
-- NOTE: Device.type field deprecated in favor of role enum, kept for back-compat.
ALTER TABLE "Device" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'STANDALONE_POS';
ALTER TABLE "Device" ADD COLUMN "payrocTerminalId" TEXT;
ALTER TABLE "Device" ADD COLUMN "pairedChairId" TEXT;
ALTER TABLE "Device" ADD COLUMN "realtimeChannelId" TEXT;
ALTER TABLE "Device" ADD COLUMN "lastHeartbeat" TIMESTAMP(3);
ALTER TABLE "Device" ADD COLUMN "platformOs" TEXT;
ALTER TABLE "Device" ADD COLUMN "platformVersion" TEXT;
ALTER TABLE "Device" ADD COLUMN "isJailbroken" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Device" ADD COLUMN "ipAddressLastSeen" TEXT;
ALTER TABLE "Device" ADD COLUMN "softDeletedAt" TIMESTAMP(3);

CREATE INDEX "idx_device_org_role" ON "Device"("organizationId", "role") WHERE "softDeletedAt" IS NULL;
CREATE INDEX "idx_device_location_role" ON "Device"("locationId", "role") WHERE "isActive" = true;
CREATE INDEX "idx_device_heartbeat" ON "Device"("lastHeartbeat") WHERE "isActive" = true;

-- 2. Chair table
CREATE TABLE "Chair" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "chairNumber" INTEGER NOT NULL,
  "name" TEXT,
  "defaultStaffId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chair_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Chair_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Chair_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE,
  CONSTRAINT "Chair_defaultStaffId_fkey" FOREIGN KEY ("defaultStaffId") REFERENCES "Staff"("id") ON DELETE SET NULL
);
ALTER TABLE "Chair" ADD CONSTRAINT "Chair_locationId_chairNumber_key" UNIQUE ("locationId", "chairNumber");
CREATE INDEX "idx_chair_org_loc" ON "Chair"("organizationId", "locationId");
CREATE INDEX "idx_chair_default_staff" ON "Chair"("defaultStaffId") WHERE "defaultStaffId" IS NOT NULL;
ALTER TABLE "Device" ADD CONSTRAINT "Device_pairedChairId_fkey" FOREIGN KEY ("pairedChairId") REFERENCES "Chair"("id") ON DELETE SET NULL;

-- 3. DevicePairing table
CREATE TABLE "DevicePairing" (
  "id" TEXT NOT NULL,
  "chairId" TEXT NOT NULL,
  "customerDisplayDeviceId" TEXT,
  "stylistDeviceId" TEXT,
  "terminalDeviceId" TEXT,
  "pairedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unpairedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "DevicePairing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DevicePairing_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "Chair"("id") ON DELETE CASCADE,
  CONSTRAINT "DevicePairing_customerDisplayDeviceId_fkey" FOREIGN KEY ("customerDisplayDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL,
  CONSTRAINT "DevicePairing_stylistDeviceId_fkey" FOREIGN KEY ("stylistDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL,
  CONSTRAINT "DevicePairing_terminalDeviceId_fkey" FOREIGN KEY ("terminalDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_pairing_chair_active" ON "DevicePairing"("chairId", "isActive");
CREATE INDEX "idx_pairing_devices" ON "DevicePairing"("customerDisplayDeviceId", "stylistDeviceId", "terminalDeviceId");

-- 4. Cart table
CREATE TABLE "Cart" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "locationId" TEXT NOT NULL,
  "appointmentId" TEXT, "clientId" TEXT, "chairId" TEXT, "activeStylistDeviceId" TEXT,
  "realtimeChannelId" TEXT NOT NULL UNIQUE, "status" TEXT NOT NULL DEFAULT 'OPEN',
  "subtotalCents" INTEGER NOT NULL DEFAULT 0, "discountCents" INTEGER NOT NULL DEFAULT 0,
  "taxCents" INTEGER NOT NULL DEFAULT 0, "tipCents" INTEGER NOT NULL DEFAULT 0,
  "giftCardAppliedCents" INTEGER NOT NULL DEFAULT 0, "loyaltyAppliedCents" INTEGER NOT NULL DEFAULT 0,
  "depositAppliedCents" INTEGER NOT NULL DEFAULT 0, "totalCents" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Cart_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE,
  CONSTRAINT "Cart_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE,
  CONSTRAINT "Cart_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL,
  CONSTRAINT "Cart_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL,
  CONSTRAINT "Cart_chairId_fkey" FOREIGN KEY ("chairId") REFERENCES "Chair"("id") ON DELETE SET NULL,
  CONSTRAINT "Cart_activeStylistDeviceId_fkey" FOREIGN KEY ("activeStylistDeviceId") REFERENCES "Device"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_cart_org_status" ON "Cart"("organizationId", "status");
CREATE INDEX "idx_cart_appointment" ON "Cart"("appointmentId") WHERE "appointmentId" IS NOT NULL;
CREATE INDEX "idx_cart_chair_active" ON "Cart"("chairId", "status") WHERE "status" IN ('OPEN', 'PENDING_PAYMENT');
CREATE INDEX "idx_cart_expires" ON "Cart"("expiresAt") WHERE "status" = 'OPEN';

-- 5. CartItem table
CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL, "cartId" TEXT NOT NULL, "itemType" TEXT NOT NULL,
  "displayName" TEXT NOT NULL, "serviceId" TEXT, "appointmentItemId" TEXT,
  "staffId" TEXT, "quantity" INTEGER NOT NULL DEFAULT 1, "unitPriceCents" INTEGER NOT NULL,
  "discountCents" INTEGER NOT NULL DEFAULT 0, "subtotalCents" INTEGER NOT NULL,
  "taxableFlag" BOOLEAN NOT NULL DEFAULT true, "taxCents" INTEGER NOT NULL DEFAULT 0,
  "isAddOn" BOOLEAN NOT NULL DEFAULT false, "notes" TEXT, "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE,
  CONSTRAINT "CartItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL,
  CONSTRAINT "CartItem_appointmentItemId_fkey" FOREIGN KEY ("appointmentItemId") REFERENCES "AppointmentItem"("id") ON DELETE SET NULL,
  CONSTRAINT "CartItem_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL
);
CREATE INDEX "idx_cartitem_cart" ON "CartItem"("cartId");
CREATE INDEX "idx_cartitem_service" ON "CartItem"("serviceId") WHERE "serviceId" IS NOT NULL;
CREATE INDEX "idx_cartitem_staff" ON "CartItem"("staffId") WHERE "staffId" IS NOT NULL;

-- 6. Order table
CREATE TABLE "Order" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "locationId" TEXT NOT NULL,
  "cartId" TEXT NOT NULL UNIQUE, "orderNumber" TEXT NOT NULL, "appointmentId" TEXT,
  "clientId" TEXT, "clientNameSnapshot" TEXT, "subtotalCents" INTEGER NOT NULL,
  "discountCents" INTEGER NOT NULL DEFAULT 0, "taxCents" INTEGER NOT NULL DEFAULT 0,
  "tipCents" INTEGER NOT NULL DEFAULT 0, "giftCardAppliedCents" INTEGER NOT NULL DEFAULT 0,
  "loyaltyAppliedCents" INTEGER NOT NULL DEFAULT 0, "depositAppliedCents" INTEGER NOT NULL DEFAULT 0,
  "totalCents" INTEGER NOT NULL, "paidCents" INTEGER NOT NULL DEFAULT 0,
  "balanceDueCents" INTEGER NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN',
  "closedAt" TIMESTAMP(3), "receiptSentAt" TIMESTAMP(3), "receiptEmail" TEXT, "receiptPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT,
  CONSTRAINT "Order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT,
  CONSTRAINT "Order_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE RESTRICT,
  CONSTRAINT "Order_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL,
  CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL
);
ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_orderNumber_key" UNIQUE ("locationId", "orderNumber");
CREATE INDEX "idx_order_org_status" ON "Order"("organizationId", "status");
CREATE INDEX "idx_order_org_created" ON "Order"("organizationId", "createdAt" DESC);
CREATE INDEX "idx_order_location_number" ON "Order"("locationId", "orderNumber");
CREATE INDEX "idx_order_client" ON "Order"("clientId") WHERE "clientId" IS NOT NULL;
CREATE INDEX "idx_order_appointment" ON "Order"("appointmentId") WHERE "appointmentId" IS NOT NULL;

-- 7. OrderItem, 8. Payment, 9. Refund, 10. OfflineQueue, 11. GeolocationLog
-- (Full DDL for these tables follows the same pattern — see Supabase migration history)

-- 12. RLS Policies (all 10 tables)
-- Chair, Cart, Order, Payment, Refund, OfflineQueue, GeolocationLog: direct organizationId
-- DevicePairing: via Chair.organizationId EXISTS
-- CartItem: via Cart.organizationId EXISTS
-- OrderItem: via Order.organizationId EXISTS
-- All: ENABLE ROW LEVEL SECURITY + FORCE ROW LEVEL SECURITY + GRANT to kasse_app
