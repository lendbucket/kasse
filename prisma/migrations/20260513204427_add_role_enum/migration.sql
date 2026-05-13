-- P0.A.1: Drop String User.role, add Role enum with 9 values
-- ABO-002: Role enum at the database level
--
-- Run as the postgres role. Role separation (kasse_app least-privilege runtime
-- role) is deferred to a separate P0 PR; this migration assumes the standard
-- postgres user setup.

-- 1. Create the enum type
CREATE TYPE "Role" AS ENUM (
  'SUPERADMIN',
  'OWNER',
  'MANAGER',
  'STAFF',
  'STAFF_VIEW_ONLY',
  'CLIENT',
  'FRANCHISE_OWNER',
  'ACCOUNTANT',
  'BUSINESS_PARTNER'
);

-- 2. Add a new column (nullable, temporary)
ALTER TABLE "User" ADD COLUMN "role_new" "Role";

-- 3. Backfill from old role string
UPDATE "User" SET "role_new" =
  CASE LOWER("role")
    WHEN 'admin'       THEN 'SUPERADMIN'::"Role"
    WHEN 'superadmin'  THEN 'SUPERADMIN'::"Role"
    WHEN 'owner'       THEN 'OWNER'::"Role"
    WHEN 'manager'     THEN 'MANAGER'::"Role"
    WHEN 'staff'       THEN 'STAFF'::"Role"
    WHEN 'stylist'     THEN 'STAFF'::"Role"
    WHEN 'client'      THEN 'CLIENT'::"Role"
    WHEN 'accountant'  THEN 'ACCOUNTANT'::"Role"
    ELSE 'STAFF'::"Role"  -- safe default for any unrecognized value
  END;

-- 4. Drop old column
ALTER TABLE "User" DROP COLUMN "role";

-- 5. Rename new column
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- 6. Make non-nullable and set default
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STAFF'::"Role";

