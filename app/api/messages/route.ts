import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { withTenantScope } from "@/lib/tenant/db-scope";

export async function GET(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  const messages = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.message.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { sentAt: "desc" },
      include: { client: { select: { id: true, name: true, phone: true, email: true } } },
    });
  });

  // Group by clientId, keep latest message per client.
  const conversationMap = new Map<string, typeof messages[0]>();
  for (const msg of messages) {
    if (!conversationMap.has(msg.clientId)) {
      conversationMap.set(msg.clientId, msg);
    }
  }

  const conversations = Array.from(conversationMap.values()).map((msg) => ({
    clientId: msg.clientId,
    clientName: msg.client.name,
    clientPhone: msg.client.phone,
    lastMessage: msg.content,
    lastMessageAt: msg.sentAt,
    direction: msg.direction,
    isRead: msg.isRead,
  }));

  return NextResponse.json({ conversations });
}

type SendMessageBody = {
  clientId: string;
  content: string;
  channel?: string;
};

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: SendMessageBody;
  try {
    body = (await request.json()) as SendMessageBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.clientId || !body.content) {
    return NextResponse.json({ error: "Client and content required" }, { status: 400 });
  }

  // Verify the client belongs to this tenant before writing a message under it.
  // This is a manual scope check; we don't have an assertClientInTenant helper yet
  // and adding one is out of scope for this commit.
  const clientCheck = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.client.findFirst({
      where: { id: body.clientId, organizationId: ctx.organizationId },
      select: { id: true },
    });
  });
  if (!clientCheck) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Resolve the calling user's Staff record (if they have one). Owners who are
  // also stylists will have a Staff row keyed by userId; admin-only owners
  // will not. Either way, the message gets the correct staffId or null.
  const staff = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.staff.findFirst({
      where: { userId: ctx.userId, organizationId: ctx.organizationId },
      select: { id: true },
    });
  });

  const message = await withTenantScope(prisma, ctx, async (tx) => {
    return tx.message.create({
      data: {
        organizationId: ctx.organizationId,
        clientId: body.clientId,
        direction: "outbound",
        channel: body.channel || "sms",
        content: body.content,
        status: "sent",
        staffId: staff?.id ?? null,
      },
    });
  });

  return NextResponse.json({ message }, { status: 201 });
}
