import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Session error:", error);
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base, #06080d)",
      }}
    >
      <div className="hidden lg:block">
        <Sidebar user={session.user} />
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: 80,
        }}
        className="lg:pb-0"
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
