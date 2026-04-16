import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TransactionBody = {
  locationId: string;
  staffId?: string;
  clientName?: string;
  amount: number;
  tip?: number;
  tax?: number;
  total: number;
  paymentMethod?: "cash" | "card" | "other";
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TransactionBody;
  try {
    body = (await request.json()) as TransactionBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.locationId || typeof body.amount !== "number" || typeof body.total !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get organizationId from location
  const location = await prisma.location.findUnique({ where: { id: body.locationId }, select: { organizationId: true } });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 400 });

  const transaction = await prisma.transaction.create({
    data: {
      locationId: body.locationId,
      organizationId: location.organizationId,
      staffId: body.staffId ?? null,
      clientName: body.clientName ?? null,
      subtotal: body.amount,
      tip: body.tip ?? 0,
      tax: body.tax ?? 0,
      total: body.total,
      paymentMethod: body.paymentMethod ?? null,
      status: "completed",
    },
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
