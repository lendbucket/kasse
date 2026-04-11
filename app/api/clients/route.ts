import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim() ?? "";
  const locationId = params.get("locationId");

  const where: Record<string, unknown> = {};
  if (locationId) where.locationId = locationId;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { appointments: true } },
      appointments: {
        orderBy: { startTime: "desc" },
        take: 1,
        select: { startTime: true },
      },
    },
  });

  const shaped = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    notes: c.notes,
    locationId: c.locationId,
    visitCount: c._count.appointments,
    lastVisit: c.appointments[0]?.startTime ?? null,
  }));

  return NextResponse.json({ clients: shaped });
}

type CreateBody = {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  locationId: string;
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

  if (!body.name?.trim() || !body.locationId) {
    return NextResponse.json(
      { error: "Name and locationId required" },
      { status: 400 },
    );
  }

  const client = await prisma.client.create({
    data: {
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      notes: body.notes?.trim() || null,
      locationId: body.locationId,
    },
  });

  return NextResponse.json({ client }, { status: 201 });
}
