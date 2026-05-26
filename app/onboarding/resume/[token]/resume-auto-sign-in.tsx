"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  token: string;
}

export default function ResumeAutoSignIn({ token }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await signIn("onboarding-resume", {
          token,
          redirect: false,
        });
        if (cancelled) return;
        if (result?.ok) {
          router.push("/onboarding/wizard");
          router.refresh();
        } else {
          setError(
            "We couldn't sign you back in. Please request a new link from your sign-in page.",
          );
        }
      } catch {
        if (cancelled) return;
        setError(
          "Something went wrong. Please request a new link from your sign-in page.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f7f8fa",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "48px 40px",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {error ? (
          <>
            <h1
              style={{
                fontSize: "20px",
                fontWeight: 600,
                color: "#111827",
                margin: "0 0 12px 0",
              }}
            >
              Couldn't resume your signup
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: "0 0 24px 0",
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
            <a
              href="/login"
              style={{
                display: "inline-block",
                backgroundColor: "#606E74",
                color: "#ffffff",
                padding: "10px 20px",
                borderRadius: "6px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Go to sign-in
            </a>
          </>
        ) : (
          <>
            <div
              style={{
                width: "32px",
                height: "32px",
                margin: "0 auto 16px",
                border: "3px solid #e5e7eb",
                borderTopColor: "#606E74",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                fontSize: "14px",
                color: "#6b7280",
                margin: 0,
              }}
            >
              Signing you back in…
            </p>
          </>
        )}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
