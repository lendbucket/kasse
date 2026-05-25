"use client";

import { useRouter } from "next/navigation";
import { TOTAL_WIZARD_STEPS, WIZARD_STEP_LABELS } from "@/lib/onboarding/wizard-step-mapping";

export interface ProgressBarProps {
  currentStep: number; // 1–8
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
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
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        // Only completed steps are tappable. Current step is not (you're
        // already on it). Future steps are not (no skipping forward).
        const isTappable = isComplete;

        const segmentColor = isComplete
          ? "#606E74"     // Kasse accent — completed
          : isCurrent
            ? "#606E74"   // Kasse accent — current
            : "#e5e7eb";  // Gray — future

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
            aria-label={`Step ${stepNumber}: ${WIZARD_STEP_LABELS[i]}${isCurrent ? " (current)" : isComplete ? " (completed, tap to revisit)" : ""}`}
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
              opacity: isCurrent ? 1 : isComplete ? 0.9 : 0.5,
            }}
          />
        );
      })}
    </div>
  );
}
