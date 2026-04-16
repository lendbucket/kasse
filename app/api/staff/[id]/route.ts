import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: "manager" | "stylist";
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
  if (body.email !== undefined) data.email = body.email?.toString().trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.toString().trim() || null;
  if (body.role !== undefined) {
    data.role = body.role === "manager" ? "manager" : "stylist";
  }
  if (typeof body.locationId === "string" && body.locationId) {
    data.locationId = body.locationId;
  }
  if (typeof body.active === "boolean") data.isActive = body.active;

  const staff = await prisma.staff.update({ where: { id }, data });
  return NextResponse.json({ staff });
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

  const staff = await prisma.staff.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ staff });
}
