import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try { session = await getServerSession(authOptions); } catch { redirect("/login"); }
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f8fa" }}>
      <div className="hidden md:block" style={{ flexShrink: 0 }}>
        <Sidebar user={session.user} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }} className="md:pb-0">
        {children}
      </div>
      <div className="md:hidden"><BottomNav /></div>
    </div>
  );
}
