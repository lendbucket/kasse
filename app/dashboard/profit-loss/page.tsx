import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LineChart } from "lucide-react"
import { EmptyState } from "@/components/layout/EmptyState"

export default async function ProfitLossPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (!["owner", "superadmin"].includes(session.user.role)) redirect("/dashboard")

  return (
    <EmptyState
      icon={LineChart}
      title="Profit & Loss"
      description="Track revenue, expenses, and net profit across all locations. Coming soon."
    />
  )
}
