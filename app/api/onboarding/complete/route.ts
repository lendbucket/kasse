import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const orgId = session.user.organizationId

    // Update organization with all merchant application data
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.legalName,
        legalName: data.legalName,
        dbaName: data.dbaName || null,
        businessType: data.businessType,
        ein: data.ein,
        phone: data.phone,
        website: data.website || null,
        ownerFirstName: data.ownerFirst,
        ownerLastName: data.ownerLast,
        ownerDob: data.dobMonth && data.dobDay && data.dobYear
          ? `${data.dobYear}-${data.dobMonth.padStart(2, "0")}-${data.dobDay.padStart(2, "0")}`
          : null,
        ownerSsnLast4: data.ssnLast4,
        ownerTitle: data.ownerTitle,
        ownershipPercentage: parseInt(data.ownershipPct) || null,
        ownerAddress: data.ownerAddress,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        bankAccountHolder: data.bankHolder,
        bankRoutingNumber: data.routing,
        bankAccountNumber: data.account,
        bankAccountType: data.accountType,
        fundingSpeed: data.fundingSpeed,
        monthlyVolume: data.volume,
        avgTransaction: data.avgTx,
        paymentMethods: data.paymentMethods || [],
        applicationStatus: "pending_review",
        applicationSubmittedAt: new Date(),
        onboardingStep: 7,
        onboardingCompleted: true,
      },
    })

    // Create default location if none exists
    const existingLocation = await prisma.location.findFirst({ where: { organizationId: orgId } })
    if (!existingLocation) {
      await prisma.location.create({
        data: {
          organizationId: orgId,
          name: data.dbaName || data.legalName,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          phone: data.phone,
        },
      })
    }

    // Create default business settings if none exist
    await prisma.businessSettings.upsert({
      where: { organizationId: orgId },
      create: { organizationId: orgId },
      update: {},
    })

    // Send notification email to admin
    const bizType = data.businessType?.replace(/_/g, " ") || "Unknown"
    const paymentMethodLabels = (data.paymentMethods || []).join(", ")

    await resend.emails.send({
      from: "Kasse System <onboarding@kasseapp.com>",
      to: "ceo@36west.org",
      subject: `New Merchant Application — ${data.legalName}`,
      headers: { "X-Entity-Ref-ID": crypto.randomUUID() },
      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:-apple-system,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#111827;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.06)">
    <div style="background:#635bff;padding:24px 32px">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:white">New Merchant Application</h1>
      <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7)">SalonTransact / Payroc</p>
    </div>
    <div style="padding:32px">
      <h3 style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Business</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Legal Name</td><td style="padding:6px 0;color:white;font-size:14px;font-weight:500;text-align:right">${data.legalName}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">DBA</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.dbaName || "\u2014"}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Type</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${bizType}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">EIN</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.ein}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Phone</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.phone}</td></tr>
      </table>
      <h3 style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Owner</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Name</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.ownerFirst} ${data.ownerLast}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Title</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.ownerTitle}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Ownership</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.ownershipPct}%</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Email</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${session.user.email}</td></tr>
      </table>
      <h3 style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Location</h3>
      <p style="color:white;font-size:14px;margin:0 0 24px">${data.address}, ${data.city}, ${data.state} ${data.zip}</p>
      <h3 style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Banking</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Account Holder</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.bankHolder}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Routing</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.routing}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Type</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.accountType}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Funding</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.fundingSpeed?.replace("_", " ")}</td></tr>
      </table>
      <h3 style="color:rgba(255,255,255,0.4);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px">Processing</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Volume</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.volume}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Avg Transaction</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${data.avgTx}</td></tr>
        <tr><td style="padding:6px 0;color:rgba(255,255,255,0.4);font-size:13px">Methods</td><td style="padding:6px 0;color:white;font-size:14px;text-align:right">${paymentMethodLabels}</td></tr>
      </table>
    </div>
  </div>
</body></html>`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding complete error:", error)
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 })
  }
}
