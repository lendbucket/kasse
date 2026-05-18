import type { Prisma } from "@prisma/client";
import type { AppointmentBookingRequest, AppointmentChangeSource } from "./types";
import { getServicePriceForBooking, getServiceDurationForBooking } from "@/lib/services/pricing";
import { writeAuditLog } from "@/lib/audit/write";
import { AuditAction } from "@/lib/audit/helpers";

type Tx = Prisma.TransactionClient;

/**
 * Create an appointment with multiple service items in a single transaction.
 * Enforces exactly one isPrimary=true item. Resolves price + duration at booking
 * time via getServicePriceForBooking / getServiceDurationForBooking.
 *
 * REQUIRES: tx parameter (scoped Prisma transaction with tenant context set).
 */
export async function createAppointmentWithItems(
  tx: Tx,
  request: AppointmentBookingRequest,
): Promise<{ appointmentId: string; itemIds: string[] }> {
  const primaryCount = request.items.filter((i) => i.isPrimary).length;
  if (primaryCount !== 1) {
    throw new Error(
      `Exactly one item must be isPrimary=true, got ${primaryCount}`,
    );
  }

  const startTime = new Date(
    Math.min(...request.items.map((i) => i.scheduledStart.getTime())),
  );
  const endTime = new Date(
    Math.max(...request.items.map((i) => i.scheduledEnd.getTime())),
  );

  const primaryItem = request.items.find((i) => i.isPrimary)!;

  const appointment = await tx.appointment.create({
    data: {
      organizationId: request.organizationId,
      locationId: request.locationId,
      clientId: request.clientId,
      staffId: primaryItem.staffId,
      serviceId: primaryItem.serviceId,
      startTime,
      endTime,
      bookingSource: request.bookingSource,
      bookedByUserId: request.bookedByUserId,
      bookedByStaffId: request.bookedByStaffId,
      seriesId: request.seriesId,
      notes: request.notes,
      isWalkIn: request.bookingSource === "WALK_IN",
      status: "scheduled",
    },
  });

  const itemIds: string[] = [];
  for (const item of request.items) {
    const pricing = await getServicePriceForBooking(tx, {
      serviceId: item.serviceId,
      locationId: request.locationId,
      staffId: item.staffId,
    });
    const duration = await getServiceDurationForBooking(tx, {
      serviceId: item.serviceId,
      locationId: request.locationId,
      staffId: item.staffId,
    });

    const created = await tx.appointmentItem.create({
      data: {
        appointmentId: appointment.id,
        serviceId: item.serviceId,
        staffId: item.staffId,
        scheduledStart: item.scheduledStart,
        scheduledEnd: item.scheduledEnd,
        priceAtBookingCents: pricing.effectiveCents,
        durationAtBookingMinutes: duration.effectiveTotalMinutes,
        isPrimary: item.isPrimary,
        isAddOn: item.isAddOn,
        displayOrder: item.displayOrder,
        notes: item.notes,
        status: "SCHEDULED",
      },
    });
    itemIds.push(created.id);
  }

  // Update appointment totals from items
  const totals = await tx.appointmentItem.aggregate({
    where: { appointmentId: appointment.id },
    _sum: {
      priceAtBookingCents: true,
      durationAtBookingMinutes: true,
    },
  });

  await tx.appointment.update({
    where: { id: appointment.id },
    data: {
      estimatedTotalCents: totals._sum.priceAtBookingCents,
      estimatedTotalMinutes: totals._sum.durationAtBookingMinutes,
    },
  });

  // Status history entry
  const changeSource: AppointmentChangeSource =
    request.bookingSource === "AI_RECEPTIONIST"
      ? "AI_AGENT"
      : request.bookingSource === "CUSTOMER_ONLINE"
        ? "CUSTOMER"
        : "STAFF";

  await tx.appointmentStatusHistory.create({
    data: {
      appointmentId: appointment.id,
      previousStatus: null,
      newStatus: "scheduled",
      changedByUserId: request.bookedByUserId,
      changedByStaffId: request.bookedByStaffId,
      changeSource,
    },
  });

  await writeAuditLog({
    userId: request.bookedByUserId,
    organizationId: request.organizationId,
    action: AuditAction.APPOINTMENT_CREATE,
    entity: "Appointment",
    entityId: appointment.id,
    after: {
      itemCount: request.items.length,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      bookingSource: request.bookingSource,
    },
  });

  return { appointmentId: appointment.id, itemIds };
}

/**
 * Update appointment status with audit trail.
 */
export async function updateAppointmentStatus(
  tx: Tx,
  args: {
    appointmentId: string;
    organizationId: string;
    newStatus: string;
    changedByUserId: string | null;
    changedByStaffId: string | null;
    changeSource: AppointmentChangeSource;
    changeReason: string | null;
  },
): Promise<void> {
  const before = await tx.appointment.findFirst({
    where: { id: args.appointmentId, organizationId: args.organizationId },
    select: { status: true },
  });
  if (!before) {
    throw new Error("Appointment not found");
  }

  await tx.appointment.update({
    where: { id: args.appointmentId },
    data: {
      status: args.newStatus,
      ...(args.newStatus === "checked_in" ? { checkedInAt: new Date() } : {}),
      ...(args.newStatus === "completed" ? { completedAt: new Date() } : {}),
      ...(args.newStatus === "cancelled" ? { cancelledAt: new Date() } : {}),
    },
  });

  await tx.appointmentStatusHistory.create({
    data: {
      appointmentId: args.appointmentId,
      previousStatus: before.status,
      newStatus: args.newStatus,
      changedByUserId: args.changedByUserId,
      changedByStaffId: args.changedByStaffId,
      changeReason: args.changeReason,
      changeSource: args.changeSource,
    },
  });

  await writeAuditLog({
    userId: args.changedByUserId,
    organizationId: args.organizationId,
    action: AuditAction.APPOINTMENT_STATUS_CHANGE,
    entity: "Appointment",
    entityId: args.appointmentId,
    before: { status: before.status },
    after: { status: args.newStatus },
  });
}
