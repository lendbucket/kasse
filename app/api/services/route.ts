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
  const activeParam = params.get("active"); // "all" | "false" | default true

  const where: Record<string, unknown> = {};
  if (locationId) where.locationId = locationId;
  if (activeParam !== "all") {
    where.isActive = activeParam === "false" ? false : true;
  }

  const services = await prisma.service.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ services });
}

type CreateBody = {
  name: string;
  price: number;
  duration: number;
  category?: string | null;
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

  if (
    !body.name?.trim() ||
    !body.locationId ||
    typeof body.price !== "number" ||
    typeof body.duration !== "number" ||
    body.price < 0 ||
    body.duration <= 0
  ) {
    return NextResponse.json(
      { error: "Missing or invalid fields" },
      { status: 400 },
    );
  }

  // Get organizationId from location
  const location = await prisma.location.findUnique({ where: { id: body.locationId }, select: { organizationId: true } });
  if (!location) return NextResponse.json({ error: "Location not found" }, { status: 400 });

  const service = await prisma.service.create({
    data: {
      name: body.name.trim(),
      price: body.price,
      duration: Math.round(body.duration),
      category: body.category?.trim() || null,
      locationId: body.locationId,
      organizationId: location.organizationId,
      isActive: body.active ?? true,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
}
