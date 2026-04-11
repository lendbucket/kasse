import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { startTime: "desc" },
        take: 10,
        include: { staff: { select: { name: true } } },
      },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const totals = await prisma.appointment.aggregate({
    where: { clientId: id, status: "completed" },
    _sum: { price: true },
  });

  return NextResponse.json({
    client: {
      ...client,
      totalSpent: totals._sum.price ?? 0,
    },
  });
}

type PatchBody = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
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

  const data: Record<string, string | null> = {};
  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = v;
  }
  if (body.email !== undefined) data.email = body.email?.toString().trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.toString().trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.toString() ?? null;

  const client = await prisma.client.update({ where: { id }, data });
  return NextResponse.json({ client });
}
