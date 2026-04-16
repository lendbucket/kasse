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
  const locationId = params.get("locationId");
  const activeParam = params.get("active"); // "all" | "true" | null(default true)

  const where: Record<string, unknown> = {};
  if (locationId) where.locationId = locationId;
  if (activeParam !== "all") {
    where.isActive = activeParam === "false" ? false : true;
  }

  const staff = await prisma.staff.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      location: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ staff });
}

type CreateBody = {
  name: string;
  email?: string;
  phone?: string;
  role?: "manager" | "stylist";
  locationId: string;
  active?: boolean;
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

  const role = body.role === "manager" ? "manager" : "stylist";

  // Get organizationId from location
  const location = await prisma.location.findUnique({ where: { id: body.locationId }, select: { organizationId: true } });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 400 });

  const staff = await prisma.staff.create({
    data: {
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      role,
      locationId: body.locationId,
      organizationId: location.organizationId,
      isActive: body.active ?? true,
    },
  });

  return NextResponse.json({ staff }, { status: 201 });
}
