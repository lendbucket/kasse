import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Landmark } from "lucide-react"
import { EmptyState } from "@/components/layout/EmptyState"

export default async function BankingPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (!["owner", "superadmin"].includes(session.user.role)) redirect("/dashboard")

  return (
    <EmptyState
      icon={Landmark}
      title="Banking"
      description="View your settlement deposits, manage bank accounts, and reconcile payouts. Coming soon."
    />
  )
}
