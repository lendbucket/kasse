import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", padding: "40px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 12,
        background: "rgba(96,110,116,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <Icon size={28} strokeWidth={1.5} color="#606E74" />
      </div>
      <h1 style={{
        fontSize: 20, fontWeight: 600, color: "#111827",
        margin: "0 0 8px",
      }}>
        {title}
      </h1>
      <p style={{
        fontSize: 14, color: "#6b7280",
        margin: 0, maxWidth: 420, lineHeight: 1.5,
      }}>
        {description}
      </p>
    </div>
  )
}
