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
import ServicesForm from "./services-form";

export const dynamic = "force-dynamic";

const STEP_NUMBER = 2;

export default async function WizardStep2Page() {
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
  // so the form runs the full flow rather than silently rendering a
  // half-broken state.
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

  // Load the org's vertical config to get default services for preview
  let defaultServices: Array<{
    name: string;
    category: string | null;
    durationMinutes: number;
    priceCents: number;
  }> = [];

  if (onboardingSession.organizationId) {
    const org = await prismaAdmin.organization.findUnique({
      where: { id: onboardingSession.organizationId },
      select: { verticalId: true },
    });
    if (org) {
      const config = getVerticalConfig(org.verticalId as VerticalId);
      defaultServices = config.defaultServices.map((s) => ({
        name: s.name,
        category: s.category ?? null,
        durationMinutes: s.durationMinutes,
        priceCents: s.priceCents,
      }));
    }
  }

  const stepLabel = WIZARD_STEP_LABELS[STEP_NUMBER - 1];

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
        <ServicesForm
          sessionId={onboardingSession.id}
          initialState={safeState}
          defaultServices={defaultServices}
        />
      </div>
    </>
  );
}
