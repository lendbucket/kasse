import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  name?: string;
  price?: number;
  duration?: number;
  category?: string | null;
  locationId?: string;
  active?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = v;
  }
  if (typeof body.price === "number") {
    if (body.price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    data.price = body.price;
  }
  if (typeof body.duration === "number") {
    if (body.duration <= 0) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }
    data.duration = Math.round(body.duration);
  }
  if (body.category !== undefined) {
    data.category = body.category?.toString().trim() || null;
  }
  if (typeof body.locationId === "string" && body.locationId) {
    data.locationId = body.locationId;
  }
  if (typeof body.active === "boolean") data.active = body.active;

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json({ service });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const service = await prisma.service.update({
    where: { id },
    data: { active: false },
  });
  return NextResponse.json({ service });
}
