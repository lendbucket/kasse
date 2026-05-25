import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function WizardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  // Auth gate: wizard requires a logged-in user
  if (!session?.user?.id) {
    redirect("/login?returnTo=/onboarding/wizard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f7f8fa",
        padding: "40px 20px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
