import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "./AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session
  try {
    session = await getServerSession(authOptions)
  } catch {
    redirect("/login")
  }
  if (!session) redirect("/login")
  if (session.user.role !== "superadmin") redirect("/dashboard")

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0d1117" }}>
      <div style={{ flexShrink: 0 }}>
        <AdminSidebar />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </div>
    </div>
  )
}
