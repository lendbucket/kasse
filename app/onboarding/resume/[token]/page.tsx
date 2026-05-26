import { verifyResumeToken } from "@/lib/onboarding/resume-token";
import { OnboardingError } from "@/lib/onboarding/types";
import ResumeAutoSignIn from "./resume-auto-sign-in";
import ResumeError from "./resume-error";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ResumePage({ params }: Props) {
  const { token } = await params;

  try {
    await verifyResumeToken(token);
    return <ResumeAutoSignIn token={token} />;
  } catch (err) {
    const code = err instanceof OnboardingError ? err.code : "INVALID_TOKEN";
    return <ResumeError code={code} />;
  }
}
