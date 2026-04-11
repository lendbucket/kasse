import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#06080d] text-white">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
