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

  // Defensive: validate the DB state is a known enum member before
  // passing to the client form. An unknown value (migration gap, manual
  // correction, backend-ahead-of-frontend) falls back to ACCOUNT_CREATED
  // so the form runs the full org+location flow rather than silently
  // rendering a half-broken state.
  const safeState: OnboardingState = (ONBOARDING_STATES as readonly string[]).includes(
    onboardingSession.state
  )
    ? (onboardingSession.state as OnboardingState)
    : "ACCOUNT_CREATED";

  // Guard: if user's current state maps to a step OTHER than STEP_NUMBER,
  // redirect to the right step. Prevents URL-typing to a step the user
  // hasn't reached yet.
  const actualStep = stateToWizardStep(safeState);
  if (actualStep < STEP_NUMBER) {
    redirect(`/onboarding/wizard/step-${actualStep}`);
  }
  // actualStep > STEP_NUMBER is allowed (user is revisiting a completed step)

  const stepLabel = WIZARD_STEP_LABELS[STEP_NUMBER - 1];

  const data = (onboardingSession.data as Record<string, unknown>) ?? {};
  const prefill = {
    orgName: typeof data.orgName === "string" ? data.orgName : "",
    planTier: data.planTier === "PREMIUM" ? ("PREMIUM" as const) : ("FREE" as const),
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
        <BusinessProfileForm
          sessionId={onboardingSession.id}
          initialState={safeState}
          prefill={prefill}
        />
      </div>
    </>
  );
}
