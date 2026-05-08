import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

/**
 * Bulk import handler.
 *
 * ARCHITECTURAL NOTE — 0.5.6c-2:
 * This route deliberately splits work into two phases:
 *
 * 1. ImportJob create / update — runs inside withTenantScope. These are the rows
 *    that matter for audit purposes; they tell us who initiated the import,
 *    against which org, and what the outcome was.
 *
 * 2. The bulk row loop (Client/Staff/Service/GiftCard creates) — runs against the
 *    plain prisma client OUTSIDE withTenantScope. Reasons:
 *      a) A loop of N inserts inside withTenantScope would hold a transaction open
 *         for seconds, risking Vercel's serverless timeout on larger files.
 *      b) N audit log rows for one import is noise, not signal. The ImportJob row
 *         IS the audit record.
 *      c) Each row insert is independently scoped by organizationId in the data block,
 *         so there's no cross-tenant risk even without the connection-level scope set.
 *
 * TODO(0.5.10): Replace the hand-rolled CSV parser with papaparse. The current
 * splitter breaks on commas inside quoted fields, BOM bytes, and CRLF endings.
 *
 * TODO(0.5.10): Validate locationId is non-null before Client/Service inserts.
 * The original code uses location?.id which can produce undefined and may violate
 * NOT NULL constraints depending on schema.
 */

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  // Read the form body BEFORE opening any transaction. The request body can only
  // be consumed once.
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const sourceSystem = formData.get("sourceSystem") as string;

  if (!file || !type) {
    return NextResponse.json({ error: "File and type required" }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "File must have headers and at least one data row" },
      { status: 400 },
    );
  }

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, "_").replace(/"/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return headers.reduce<Record<string, string>>(
      (obj, header, i) => ({ ...obj, [header]: values[i] || "" }),
      {},
    );
  });

  // Phase 1: create the ImportJob inside the tenant scope. This row IS the audit trail.
  const job = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.importJob.create({
      data: {
        organizationId: ctx.organizationId,
        type,
        status: "processing",
        totalRows: rows.length,
        fileName: file.name,
        sourceSystem: sourceSystem || "custom",
      },
    });
  });

  // Locate a default location for this tenant (auto-pick first). Required for
  // Client/Staff/Service inserts that need locationId.
  const location = await prisma.location.findFirst({
    where: { organizationId: ctx.organizationId },
    select: { id: true },
  });

  // Phase 2: bulk inserts using the plain prisma client. Each row is scoped by
  // organizationId in the data block. Failures are recorded per-row and do not
  // abort the import.
  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  if (type === "clients") {
    for (const row of rows) {
      try {
        const name =
          `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
          row.name ||
          "";
        if (!name) {
          failedCount++;
          errors.push("Row missing name");
          continue;
        }
        await prisma.client.create({
          data: {
            organizationId: ctx.organizationId,
            locationId: location?.id,
            name,
            firstName: row.first_name || null,
            lastName: row.last_name || null,
            email: row.email || null,
            phone: row.phone || null,
            notes: row.notes || null,
          },
        });
        successCount++;
      } catch {
        failedCount++;
        errors.push(`Failed: ${row.first_name} ${row.last_name}`);
      }
    }
  } else if (type === "staff") {
    for (const row of rows) {
      try {
        const name =
          row.name ||
          `${row.first_name || ""} ${row.last_name || ""}`.trim();
        if (!name || !location) {
          failedCount++;
          continue;
        }
        await prisma.staff.create({
          data: {
            organizationId: ctx.organizationId,
            locationId: location.id,
            name,
            email: row.email || null,
            phone: row.phone || null,
            role: row.role?.toLowerCase() || "stylist",
            commissionRate: parseFloat(row.commission_rate) || 40,
          },
        });
        successCount++;
      } catch {
        failedCount++;
        errors.push(`Failed: ${row.name}`);
      }
    }
  } else if (type === "services") {
    for (const row of rows) {
      try {
        if (!row.name) {
          failedCount++;
          continue;
        }
        await prisma.service.create({
          data: {
            organizationId: ctx.organizationId,
            locationId: location?.id,
            name: row.name,
            category: row.category || null,
            price: parseFloat(row.price) || 0,
            duration: parseInt(row.duration) || 60,
          },
        });
        successCount++;
      } catch {
        failedCount++;
      }
    }
  } else if (type === "gift_cards") {
    for (const row of rows) {
      try {
        if (!row.code || !row.balance) {
          failedCount++;
          continue;
        }
        await prisma.giftCard.create({
          data: {
            organizationId: ctx.organizationId,
            code: row.code,
            initialBalance: parseFloat(row.balance),
            balance: parseFloat(row.balance),
            expiresAt: row.expiry_date ? new Date(row.expiry_date) : null,
          },
        });
        successCount++;
      } catch {
        failedCount++;
      }
    }
  } else {
    // Unknown type — close out the job and return.
    await withTenantScope(prisma, ctx, async (tx) => {
      await tx.importJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          processedRows: 0,
          successRows: 0,
          failedRows: 0,
          errors: [`Unknown import type: ${type}`],
          completedAt: new Date(),
        },
      });
    });
    return NextResponse.json(
      { error: `Unknown import type: ${type}` },
      { status: 400 },
    );
  }

  // Phase 3: close the ImportJob with the totals. Also tenant-scoped.
  await withTenantScope(prisma, ctx, async (tx) => {
    await tx.importJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        processedRows: rows.length,
        successRows: successCount,
        failedRows: failedCount,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
      },
    });
  });

  return NextResponse.json({
    success: true,
    jobId: job.id,
    results: {
      total: rows.length,
      created: successCount,
      failed: failedCount,
      errors,
    },
  });
}

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const jobs = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.importJob.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    });
  });

  return NextResponse.json({ jobs });
}
