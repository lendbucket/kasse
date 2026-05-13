import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Receipt } from "lucide-react"
import { EmptyState } from "@/components/layout/EmptyState"

export default async function BillPayPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (!["owner", "superadmin"].includes(session.user.role)) redirect("/dashboard")

  return (
    <EmptyState
      icon={Receipt}
      title="Bill Pay"
      description="Pay vendors, manage recurring bills, and track expenses. Coming soon."
    />
  )
}
