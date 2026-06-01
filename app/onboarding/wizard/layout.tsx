import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SessionProviderWrapper from "@/components/auth/SessionProviderWrapper";

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
        backgroundColor: "var(--bg-page)",
        padding: "40px 20px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        fontFamily: "var(--font-inter), 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "var(--bg-card)",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-card)",
          overflow: "hidden",
        }}
      >
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </div>
    </div>
  );
}
