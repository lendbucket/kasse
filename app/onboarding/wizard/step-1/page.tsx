import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismaAdmin } from "@/lib/prismaAdmin";
import { stateToWizardStep, WIZARD_STEP_LABELS } from "@/lib/onboarding/wizard-step-mapping";
import { ONBOARDING_STATES } from "@/lib/onboarding/types";
import type { OnboardingState } from "@/lib/onboarding/types";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { StepCounter } from "@/components/onboarding/StepCounter";
import BusinessProfileForm from "./business-profile-form";

export const dynamic = "force-dynamic";

const STEP_NUMBER = 1;

export default async function WizardStep1Page() {
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

  const safeState: OnboardingState = (ONBOARDING_STATES as readonly string[]).includes(
    onboardingSession.state
  )
    ? (onboardingSession.state as OnboardingState)
    : "ACCOUNT_CREATED";

  const actualStep = stateToWizardStep(safeState);
  if (actualStep < STEP_NUMBER) {
    redirect(`/onboarding/wizard/step-${actualStep}`);
  }

  const stepLabel = WIZARD_STEP_LABELS[STEP_NUMBER - 1];

  const data = (onboardingSession.data as Record<string, unknown>) ?? {};
  const prefill = {
    vertical:
      typeof data.vertical === "string" &&
      (data.vertical === "salon" || data.vertical === "nail_salon")
        ? (data.vertical as "salon" | "nail_salon")
        : typeof onboardingSession.vertical === "string" &&
          (onboardingSession.vertical === "salon" || onboardingSession.vertical === "nail_salon")
        ? (onboardingSession.vertical as "salon" | "nail_salon")
        : ("" as const),
    legalName: typeof data.legalName === "string" ? data.legalName : "",
    dbaName: typeof data.dbaName === "string" ? data.dbaName : "",
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    locationName: typeof data.locationName === "string" ? data.locationName : "",
    address: typeof data.address === "string" ? data.address : "",
    city: typeof data.city === "string" ? data.city : "",
    state: typeof data.state === "string" ? data.state : "",
    zip: typeof data.zip === "string" ? data.zip : "",
    timezone: typeof data.timezone === "string" ? data.timezone : "America/Chicago",
  };

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
        <BusinessProfileForm
          sessionId={onboardingSession.id}
          initialState={safeState}
          prefill={prefill}
        />
      </div>
    </>
  );
}
