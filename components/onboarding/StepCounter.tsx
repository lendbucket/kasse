import { TOTAL_WIZARD_STEPS, WIZARD_STEP_LABELS } from "@/lib/onboarding/wizard-step-mapping";

export interface StepCounterProps {
  currentStep: number; // 1–8
}

export function StepCounter({ currentStep }: StepCounterProps) {
  const label = WIZARD_STEP_LABELS[currentStep - 1] ?? "";

  return (
    <p
      style={{
        margin: "16px 32px 24px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#606E74",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      Step {currentStep} of {TOTAL_WIZARD_STEPS} — {label}
    </p>
  );
}
