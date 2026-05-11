import { NextResponse, type NextRequest } from "next/server";
import {
  requireTenantContext,
  tenantErrorResponse,
  type TenantContext,
} from "@/lib/tenant/context";
import { Resend } from "resend";
import { getMerchantApplicationEmailHtml } from "@/lib/emails/merchant-application";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  let ctx: TenantContext;
  try {
    ctx = await requireTenantContext(request);
  } catch (e) {
    const r = tenantErrorResponse(e);
    if (r) return r;
    throw e;
  }

  let body: {
    ownerFirstName?: string;
    ownerLastName?: string;
    monthlyVolume?: string;
    avgTicket?: string;
    businessName?: string;
    ein?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ownerFirstName = body.ownerFirstName ?? "";
  const ownerLastName = body.ownerLastName ?? "";
  const monthlyVolume = body.monthlyVolume ?? "";
  const avgTicket = body.avgTicket ?? "";
  const businessName = body.businessName ?? "";
  const ein = body.ein ?? "";

  // Send merchant-facing email
  try {
    await resend.emails.send({
      from: "SalonTransact <onboarding@kasseapp.com>",
      to: ctx.email,
      subject: "Your SalonTransact Merchant Application",
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
      html: getMerchantApplicationEmailHtml({ ownerFirstName, ownerLastName, businessName, monthlyVolume, avgTicket }),
    });
  } catch (e) {
    console.error("Merchant email send failed:", e instanceof Error ? e.message : String(e));
    return NextResponse.json(
      { error: "Failed to send application email", retryable: true },
      { status: 502 },
    );
  }

  // Send admin notification email
  try {
    await resend.emails.send({
      from: "Kasse System <onboarding@kasseapp.com>",
      to: "ceo@36west.org",
      subject: `New SalonTransact Application — ${businessName}`,
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:40px auto">
          <h2>New Merchant Application</h2>
          <p><strong>Business:</strong> ${businessName}</p>
          <p><strong>Owner:</strong> ${ownerFirstName} ${ownerLastName}</p>
          <p><strong>Email:</strong> ${ctx.email}</p>
          <p><strong>EIN:</strong> ${ein || "Not provided"}</p>
          <p><strong>Monthly Volume:</strong> ${monthlyVolume}</p>
          <p><strong>Avg Ticket:</strong> ${avgTicket}</p>
        </div>
      `,
    });
  } catch (e) {
    // Admin notification failure should not block the user response — the
    // merchant email already went out. Log loudly so we can manually retry.
    console.error("Admin notification send failed (merchant email did succeed):", e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json({ success: true });
}
