"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SetRow = {
  id: string;
  name: string;
  permissionCount: number;
  assignedUsers: number;
  createdAt: string;
};

export default function RolesListClient({ sets: initial }: { sets: SetRow[] }) {
  const [sets, setSets] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/permission-sets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSets((prev) => prev.filter((s) => s.id !== id));
      setDeleting(null);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to delete");
      setDeleting(null);
    }
  }

  if (sets.length === 0) {
    return (
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "white", padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>No custom roles yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
          {error}
        </div>
      )}

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Name</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Permissions</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Assigned users</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151" }}>Created</th>
              <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600, color: "#374151" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>{s.name}</td>
                <td style={{ padding: "12px 16px", color: "#6b7280" }}>{s.permissionCount}</td>
                <td style={{ padding: "12px 16px", color: "#6b7280" }}>{s.assignedUsers}</td>
                <td style={{ padding: "12px 16px", color: "#6b7280" }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <a href={`/dashboard/settings/roles/${s.id}`} style={{ color: "#606e74", fontWeight: 600, textDecoration: "none", marginRight: 12 }}>Edit</a>
                  {deleting === s.id ? (
                    <span style={{ fontSize: 12 }}>
                      <span style={{ color: "#6b7280", marginRight: 8 }}>Delete?</span>
                      <button onClick={() => handleDelete(s.id)} style={{ color: "#dc2626", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Yes</button>
                      <span style={{ color: "#d1d5db", margin: "0 4px" }}>/</span>
                      <button onClick={() => setDeleting(null)} style={{ color: "#6b7280", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>No</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeleting(s.id)} style={{ color: "#dc2626", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </>
  );
}
