import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Resend } from "resend"
import { getMerchantApplicationEmailHtml } from "@/lib/emails/merchant-application"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ownerFirstName, ownerLastName, monthlyVolume, avgTicket, businessName, ein, email } = await req.json()

  // Send application email to merchant
  await resend.emails.send({
    from: "SalonTransact <onboarding@kasseapp.com>",
    to: email,
    subject: "Your SalonTransact Merchant Application",
    headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
    html: getMerchantApplicationEmailHtml({ ownerFirstName, ownerLastName, businessName, monthlyVolume, avgTicket }),
  })

  // Send notification to admin
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
  })

  return NextResponse.json({ success: true })
}
