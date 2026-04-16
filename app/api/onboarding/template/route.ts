import { NextRequest, NextResponse } from "next/server"

const templates: Record<string, string> = {
  clients: "first_name,last_name,email,phone,notes,created_at\nJane,Smith,jane@email.com,(555) 123-4567,VIP client,2024-01-15",
  transactions: "date,client_name,service,amount,tip,payment_method\n2024-01-15,Jane Smith,Haircut,75.00,15.00,card",
  gift_cards: "code,balance,issued_date,expiry_date\nGC-001,100.00,2024-01-01,2025-01-01",
  staff: "name,email,phone,role,commission_rate\nAlex Johnson,alex@salon.com,(555) 987-6543,stylist,40",
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "clients"
  const csv = templates[type] || templates.clients

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="kasse-${type}-template.csv"`,
    },
  })
}
