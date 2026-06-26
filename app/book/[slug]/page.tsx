import { resolvePublicContextBySlug } from "@/lib/booking/public-context";
import { BookingFlow } from "./booking-flow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await resolvePublicContextBySlug(slug);

  if (!ctx) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-page)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-inter), sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
            Not Found
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            This booking page doesn&apos;t exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BookingFlow
      slug={slug}
      organizationName={ctx.organizationName}
      locationName={ctx.locationName}
    />
  );
}
