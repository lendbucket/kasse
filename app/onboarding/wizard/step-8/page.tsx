import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaAdmin } from "@/lib/prismaAdmin";
import { stateToWizardStep, WIZARD_STEP_LABELS } from "@/lib/onboarding/wizard-step-mapping";
import type { OnboardingState } from "@/lib/onboarding/types";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepCounter } from "@/components/onboarding/StepCounter";

export const dynamic = "force-dynamic";

const STEP_NUMBER = 8;

export default async function WizardStep8Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?returnTo=/onboarding/wizard");
  }

  const onboardingSession = await prismaAdmin.onboardingSession.findFirst({
    where: {
      userId: session.user.id,
      state: { not: "COMPLETED" },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!onboardingSession) {
    redirect("/dashboard");
  }

  // Guard: if user's current state maps to a step OTHER than STEP_NUMBER,
  // redirect to the right step. Prevents URL-typing to a step the user
  // hasn't reached yet.
  const actualStep = stateToWizardStep(onboardingSession.state as OnboardingState);
  if (actualStep < STEP_NUMBER) {
    redirect(`/onboarding/wizard/step-${actualStep}`);
  }
  // actualStep > STEP_NUMBER is allowed (user is revisiting a completed step)

  const stepLabel = WIZARD_STEP_LABELS[STEP_NUMBER - 1];

  return (
    <>
      <ProgressBar currentStep={actualStep} />
      <StepCounter currentStep={STEP_NUMBER} />
      <div style={{ padding: "0 32px 48px" }}>
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: "28px",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-0.5px",
          }}
        >
          {stepLabel}
        </h1>
        <p
          style={{
            margin: "0 0 32px",
            fontSize: "16px",
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          This step is coming soon. (Placeholder for P1.C.{STEP_NUMBER})
        </p>
        <p
          style={{
            margin: "0",
            fontSize: "14px",
            color: "#9ca3af",
            lineHeight: 1.6,
          }}
        >
          Current onboarding state:{" "}
          <code
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              backgroundColor: "#f3f4f6",
              padding: "2px 6px",
              borderRadius: "4px",
              color: "#374151",
            }}
          >
            {onboardingSession.state}
          </code>
        </p>
      </div>
    </>
  );
}
