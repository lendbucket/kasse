import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaAdmin } from "@/lib/prismaAdmin";
import { stateToWizardStep, WIZARD_STEP_LABELS } from "@/lib/onboarding/wizard-step-mapping";
import { ONBOARDING_STATES } from "@/lib/onboarding/types";
import type { OnboardingState } from "@/lib/onboarding/types";
import { getVerticalConfig } from "@/lib/verticals/registry";
import type { VerticalId } from "@prisma/client";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepCounter } from "@/components/onboarding/StepCounter";
import TeamForm from "./team-form";

export const dynamic = "force-dynamic";

const STEP_NUMBER = 3;

export default async function WizardStep3Page() {
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
  // Unknown values fall back to ACCOUNT_CREATED so the user is routed
  // through the full re-validation chain rather than silently skipping.
  const safeState: OnboardingState = (ONBOARDING_STATES as readonly string[]).includes(
    onboardingSession.state
  )
    ? (onboardingSession.state as OnboardingState)
    : "ACCOUNT_CREATED";

  const actualStep = stateToWizardStep(safeState);
  if (actualStep < STEP_NUMBER) {
    redirect(`/onboarding/wizard/step-${actualStep}`);
  }

  // Load vertical terms for personalized copy
  let staffTerm = "team member";
  let staffTermPlural = "team members";

  if (onboardingSession.organizationId) {
    const org = await prismaAdmin.organization.findUnique({
      where: { id: onboardingSession.organizationId },
      select: { verticalId: true },
    });
    if (org) {
      const config = getVerticalConfig(org.verticalId as VerticalId);
      staffTerm = config.terms.staff;
      staffTermPlural = config.terms.staffPlural;
    }
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
        <TeamForm
          sessionId={onboardingSession.id}
          initialState={safeState}
          staffTerm={staffTerm}
          staffTermPlural={staffTermPlural}
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
