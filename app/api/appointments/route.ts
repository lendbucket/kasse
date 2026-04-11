import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chicagoDayBounds } from "@/lib/chicago-time";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const date = params.get("date");
  const locationId = params.get("locationId");

  const where: Record<string, unknown> = {};
  if (locationId) where.locationId = locationId;
  if (date) {
    const { start, end } = chicagoDayBounds(date);
    where.startTime = { gte: start, lt: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      staff: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ appointments });
}

type CreateBody = {
  locationId: string;
  staffId: string;
  serviceId?: string;
  clientName?: string;
  startTime: string;
  durationMinutes?: number;
  notes?: string;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.locationId || !body.staffId || !body.startTime) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const start = new Date(body.startTime);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
  }

  let duration = body.durationMinutes ?? 30;
  let serviceName: string | null = null;
  let price: number | null = null;

  if (body.serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: body.serviceId },
    });
    if (service) {
      duration = service.duration;
      serviceName = service.name;
      price = service.price;
    }
  }

  const end = new Date(start.getTime() + duration * 60_000);

  const appointment = await prisma.appointment.create({
    data: {
      locationId: body.locationId,
      staffId: body.staffId,
      serviceId: body.serviceId ?? null,
      serviceName,
      price,
      clientName: body.clientName?.trim() || null,
      startTime: start,
      endTime: end,
      notes: body.notes?.trim() || null,
      status: "scheduled",
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
