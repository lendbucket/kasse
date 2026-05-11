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

  const { ownerFirstName, ownerLastName, monthlyVolume, avgTicket, businessName, ein, email } = await request.json();

  await resend.emails.send({
    from: "SalonTransact <onboarding@kasseapp.com>",
    to: email,
    subject: "Your SalonTransact Merchant Application",
    headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    html: getMerchantApplicationEmailHtml({ ownerFirstName, ownerLastName, businessName, monthlyVolume, avgTicket }),
  });

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
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>EIN:</strong> ${ein || "Not provided"}</p>
        <p><strong>Monthly Volume:</strong> ${monthlyVolume}</p>
        <p><strong>Avg Ticket:</strong> ${avgTicket}</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
