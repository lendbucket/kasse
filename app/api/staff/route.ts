import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locationId = request.nextUrl.searchParams.get("locationId");

  const staff = await prisma.staff.findMany({
    where: {
      active: true,
      ...(locationId ? { locationId } : {}),
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ staff });
}
