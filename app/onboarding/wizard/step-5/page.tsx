import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaAdmin } from "@/lib/prismaAdmin";
import { stateToWizardStep, WIZARD_STEP_LABELS } from "@/lib/onboarding/wizard-step-mapping";
import { ONBOARDING_STATES } from "@/lib/onboarding/types";
import type { OnboardingState } from "@/lib/onboarding/types";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepCounter } from "@/components/onboarding/StepCounter";
import CompensationForm from "./compensation-form";

export const dynamic = "force-dynamic";

const STEP_NUMBER = 5;

export default async function WizardStep5Page() {
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

  // Defensive: validate state is a known enum member before casting.
  const safeState: OnboardingState = (ONBOARDING_STATES as readonly string[]).includes(
    onboardingSession.state
  )
    ? (onboardingSession.state as OnboardingState)
    : "ACCOUNT_CREATED";

  const actualStep = stateToWizardStep(safeState);
  if (actualStep < STEP_NUMBER) {
    redirect(`/onboarding/wizard/step-${actualStep}`);
  }

  // Read staff count server-side to choose variant (no-staff vs has-staff).
  let staffCount = 0;
  if (onboardingSession.organizationId && onboardingSession.locationId) {
    staffCount = await prismaAdmin.staff.count({
      where: {
        organizationId: onboardingSession.organizationId,
        locationId: onboardingSession.locationId,
        softDeletedAt: null,
      },
    });
  }

  const stepLabel = WIZARD_STEP_LABELS[STEP_NUMBER - 1];

  return (
    <>
      <ProgressBar currentStep={STEP_NUMBER} maxCompletedStep={actualStep} />
      <StepCounter currentStep={STEP_NUMBER} />
      <div style={{ padding: "0 32px 48px" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            color: "var(--text-muted)",
            margin: "0 0 6px",
          }}
        >
          Step {STEP_NUMBER}
        </p>
        <h1
          style={{
            margin: "0 0 24px",
            fontSize: 28,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.31px",
            lineHeight: 1.2,
          }}
        >
          {stepLabel}
        </h1>
        <CompensationForm
          sessionId={onboardingSession.id}
          initialState={safeState}
          staffCount={staffCount}
        />
        {process.env.NODE_ENV !== "production" && (
          <p
            style={{
              margin: "24px 0 0",
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            Current onboarding state:{" "}
            <code
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                backgroundColor: "var(--bg-cream)",
                padding: "2px 6px",
                borderRadius: 4,
                color: "var(--text-secondary)",
              }}
            >
              {onboardingSession.state}
            </code>
          </p>
        )}
      </div>
    </>
  );
}
