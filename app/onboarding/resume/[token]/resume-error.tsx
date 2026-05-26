interface Props {
  code: string;
}

const ERROR_MESSAGES: Record<string, { title: string; body: string }> = {
  INVALID_TOKEN: {
    title: "This link has expired",
    body: "The resume link you clicked is no longer valid. This usually means more than 7 days have passed since the email was sent. Please sign in again to continue setting up your account.",
  },
  SESSION_NOT_FOUND: {
    title: "Account not found",
    body: "We couldn't find an account linked to this link. Please sign in to continue, or contact support if you believe this is an error.",
  },
  SESSION_EXPIRED: {
    title: "Signup session expired",
    body: "It's been more than 30 days since you started signing up. To continue, please sign in again or restart the signup process.",
  },
  SESSION_COMPLETED: {
    title: "Your signup is already complete",
    body: "Looks like you've already finished setting up your account. Sign in to access your dashboard.",
  },
  EMAIL_MISMATCH: {
    title: "Link mismatch",
    body: "This resume link doesn't match the account it was sent to. Please sign in directly to continue.",
  },
};

export default function ResumeError({ code }: Props) {
  const message = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.INVALID_TOKEN;

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
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#111827",
            margin: "0 0 12px 0",
          }}
        >
          {message.title}
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: "0 0 28px 0",
            lineHeight: 1.5,
          }}
        >
          {message.body}
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
      </div>
    </div>
  );
}
