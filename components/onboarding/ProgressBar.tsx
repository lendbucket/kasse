"use client";

import { useRouter } from "next/navigation";
import { TOTAL_WIZARD_STEPS, WIZARD_STEP_LABELS } from "@/lib/onboarding/wizard-step-mapping";

export interface ProgressBarProps {
  /**
   * The step the user is currently viewing (1–8). This segment
   * is highlighted as "you are here."
   */
  currentStep: number;

  /**
   * The user's furthest progress in the wizard (1–8). Segments
   * 1 through maxCompletedStep-1 are shown as completed (and
   * tappable for revisit). Should always be >= currentStep —
   * a user can't be viewing a step they haven't reached.
   */
  maxCompletedStep: number;
}

export function ProgressBar({ currentStep, maxCompletedStep }: ProgressBarProps) {
  const router = useRouter();
  const totalSteps = TOTAL_WIZARD_STEPS;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "24px 32px 0",
      }}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
      aria-label={`Onboarding step ${currentStep} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isComplete = stepNumber < maxCompletedStep && stepNumber !== currentStep;
        const isCurrent = stepNumber === currentStep;
        // Tappable: any step the user has reached that isn't the
        // one they're already viewing.
        const isTappable = stepNumber <= maxCompletedStep && stepNumber !== currentStep;

        const segmentColor = isComplete || isCurrent || isTappable
          ? "#606E74"     // Kasse accent — completed/current/reached
          : "#e5e7eb";    // Gray — future

        return (
          <button
            key={stepNumber}
            type="button"
            onClick={
              isTappable
                ? () => router.push(`/onboarding/wizard/step-${stepNumber}`)
                : undefined
            }
            disabled={!isTappable}
            aria-label={`Step ${stepNumber}: ${WIZARD_STEP_LABELS[i]}${
              isCurrent
                ? " (current)"
                : isComplete
                  ? " (completed, tap to revisit)"
                  : isTappable
                    ? " (tap to revisit)"
                    : ""
            }`}
            title={WIZARD_STEP_LABELS[i]}
            style={{
              flex: 1,
              height: "4px",
              backgroundColor: segmentColor,
              border: "none",
              borderRadius: "2px",
              padding: 0,
              cursor: isTappable ? "pointer" : "default",
              transition: "background-color 0.2s",
              opacity: isCurrent ? 1 : isComplete || isTappable ? 0.9 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
