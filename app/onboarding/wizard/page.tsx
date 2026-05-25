import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaAdmin } from "@/lib/prismaAdmin";
import { stateToWizardStep } from "@/lib/onboarding/wizard-step-mapping";
import type { OnboardingState } from "@/lib/onboarding/types";

export const dynamic = "force-dynamic"; // session-dependent

export default async function WizardRootPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?returnTo=/onboarding/wizard");
  }

  // Look up the user's OnboardingSession. There is at most one active
  // session per user (one-to-zero-or-one). Active means state != COMPLETED
  // and not expired.
  const onboardingSession = await prismaAdmin.onboardingSession.findFirst({
    where: {
      userId: session.user.id,
      state: { not: "COMPLETED" },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!onboardingSession) {
    // Two cases land here:
    // 1. User has already COMPLETED onboarding → send to dashboard
    // 2. User is OAuth-bootstrapped (P1.A.8/A.9) without an
    //    OnboardingSession ever being created — currently goes to
    //    dashboard. Separate fix later to backfill these users with a
    //    session pre-positioned at ACCOUNT_CREATED.
    redirect("/dashboard");
  }

  // Map backend state → user-facing wizard step (1–8)
  const stepNumber = stateToWizardStep(onboardingSession.state as OnboardingState);

  redirect(`/onboarding/wizard/step-${stepNumber}`);
}
