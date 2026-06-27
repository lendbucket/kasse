import Link from "next/link";
import { listPublicLocationsBySlug } from "@/lib/booking/public-context";
import { BookingFlow } from "./booking-flow";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await listPublicLocationsBySlug(slug);

  if (!data || data.locations.length === 0) {
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

  if (data.locations.length === 1) {
    return (
      <BookingFlow
        slug={slug}
        organizationName={data.organizationName}
        locationName={data.locations[0].name}
      />
    );
  }

  // Multiple locations — render a location picker
  const bookableLocations = data.locations.filter((loc) => loc.bookingSlug);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-page)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-inter), sans-serif",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4, textAlign: "center" }}>
          {data.organizationName}
        </h1>
        <p style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          textAlign: "center",
          marginBottom: 32,
        }}>
          Choose a location
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bookableLocations.map((loc) => (
            <Link
              key={loc.id}
              href={`/book/${slug}/${loc.bookingSlug}`}
              style={{
                display: "block",
                padding: 20,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                textDecoration: "none",
                color: "var(--text-primary)",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 16 }}>{loc.name}</div>
              {(loc.address || loc.city) && (
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                  {loc.address ? `${loc.address}, ` : ""}{loc.city ?? ""}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
