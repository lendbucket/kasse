"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Permissions } from "@/lib/permissions/types";
import { PERMISSION_DESCRIPTIONS } from "@/lib/permissions/descriptions";
import { ROLE_DEFAULTS_BY_PERMISSION } from "@/lib/permissions/role-defaults-by-permission";
import { roleDefaults } from "@/lib/permissions/defaults";
import { Role } from "@prisma/client";

type UserRow = { id: string; name: string | null; email: string; role: string };

type Props = {
  mode: "create" | "edit";
  setId: string | null;
  initialName: string;
  initialPermissions: string[];
  initialAssignedUsers: UserRow[];
};

// Structured category list for the permission picker
const CATEGORIES = Object.entries(Permissions).map(([category, perms]) => ({
  category,
  permissions: Object.entries(perms).map(([, value]) => value as string),
}));

const COPY_FROM_ROLES: { label: string; role: Role }[] = [
  { label: "Owner defaults", role: Role.OWNER },
  { label: "Manager defaults", role: Role.MANAGER },
  { label: "Staff defaults", role: Role.STAFF },
  { label: "Staff (view only) defaults", role: Role.STAFF_VIEW_ONLY },
  { label: "Franchise Owner defaults", role: Role.FRANCHISE_OWNER },
  { label: "Accountant defaults", role: Role.ACCOUNTANT },
  { label: "Business Partner defaults", role: Role.BUSINESS_PARTNER },
];

export default function RolesEditor({ mode, setId, initialName, initialPermissions, initialAssignedUsers }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [permissions, setPermissions] = useState<Set<string>>(new Set(initialPermissions));
  const [assignedUsers, setAssignedUsers] = useState<UserRow[]>(initialAssignedUsers);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [orgUsers, setOrgUsers] = useState<UserRow[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isDirty = useCallback(() => {
    if (name !== initialName) return true;
    if (permissions.size !== initialPermissions.length) return true;
    for (const p of initialPermissions) {
      if (!permissions.has(p)) return true;
    }
    return false;
  }, [name, permissions, initialName, initialPermissions]);

  useEffect(() => { setDirty(isDirty()); }, [isDirty]);

  // Warn on navigation when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function togglePermission(key: string) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function selectAllInCategory(perms: string[]) {
    setPermissions((prev) => {
      const next = new Set(prev);
      for (const p of perms) next.add(p);
      return next;
    });
  }

  function clearAllInCategory(perms: string[]) {
    setPermissions((prev) => {
      const next = new Set(prev);
      for (const p of perms) next.delete(p);
      return next;
    });
  }

  function copyFromRole(role: Role) {
    const perms = roleDefaults[role] ?? [];
    setPermissions(new Set(perms));
  }

  async function handleSave() {
    if (!name.trim()) { setStatus({ type: "error", message: "Name is required" }); return; }
    setSaving(true);
    setStatus(null);

    const payload = { name: name.trim(), permissions: Array.from(permissions) };

    try {
      let res: Response;
      if (mode === "create") {
        res = await fetch("/api/permission-sets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/permission-sets/${setId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (mode === "create") {
          router.push(`/dashboard/settings/roles/${data.id}`);
        } else {
          setStatus({ type: "success", message: "Saved successfully" });
          setDirty(false);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus({ type: "error", message: data.error || data.message || "Save failed" });
      }
    } catch {
      setStatus({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  async function loadOrgUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setOrgUsers(data);
      }
    } catch {} finally { setLoadingUsers(false); }
  }

  async function handleAssign(userId: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customRoleId: setId }),
    });
    if (res.ok) {
      const user = await res.json();
      setAssignedUsers((prev) => [...prev, user]);
      setShowAssignModal(false);
      setStatus({ type: "success", message: "User assigned" });
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: data.error || "Assign failed" });
    }
  }

  async function handleUnassign(userId: string) {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customRoleId: null }),
    });
    if (res.ok) {
      setAssignedUsers((prev) => prev.filter((u) => u.id !== userId));
      setStatus({ type: "success", message: "User unassigned" });
    } else {
      setStatus({ type: "error", message: "Unassign failed" });
    }
  }

  const filteredOrgUsers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((u) => u.id));
    return orgUsers
      .filter((u) => !assignedIds.has(u.id))
      .filter((u) => {
        const q = assignSearch.toLowerCase();
        return !q || (u.name?.toLowerCase().includes(q)) || u.email.toLowerCase().includes(q);
      });
  }, [orgUsers, assignedUsers, assignSearch]);

  return (
    <div>
      {/* Status banner */}
      {status && (
        <div style={{
          background: status.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${status.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13,
          color: status.type === "success" ? "#166534" : "#dc2626",
        }}>
          {status.message}
        </div>
      )}

      {/* Header section: name + copy from role + save */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Role name</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Front Desk"
            style={{ width: "100%", height: 40, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 12px", fontSize: 14, color: "#111827", fontFamily: "inherit" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Copy from role</label>
          <select
            defaultValue="" onChange={(e) => { if (e.target.value) copyFromRole(e.target.value as Role); e.target.value = ""; }}
            style={{ height: 40, border: "1px solid #e5e7eb", borderRadius: 8, padding: "0 12px", fontSize: 13, color: "#374151", cursor: "pointer", fontFamily: "inherit", minWidth: 180 }}
          >
            <option value="">Select a template...</option>
            {COPY_FROM_ROLES.map((r) => <option key={r.role} value={r.role}>{r.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={saving} style={{
            height: 40, padding: "0 20px", background: "#606e74", color: "white", border: "none",
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.6 : 1, fontFamily: "inherit",
          }}>
            {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
          </button>
          <a href="/dashboard/settings/roles" style={{
            display: "inline-flex", alignItems: "center", height: 40, padding: "0 16px",
            background: "white", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8,
            fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "inherit",
          }}>
            Cancel
          </a>
        </div>
      </div>

      {/* Permission picker */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "white", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
            Permissions ({permissions.size} selected)
          </h2>
        </div>

        {CATEGORIES.map(({ category, permissions: perms }) => (
          <div key={category} style={{ borderBottom: "1px solid #f3f4f6" }}>
            {/* Category header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px", background: "#f9fafb",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#606e74", textTransform: "uppercase", letterSpacing: "0.05em" }}>{category}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => selectAllInCategory(perms)} style={{ fontSize: 11, color: "#606e74", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Select all</button>
                <span style={{ color: "#d1d5db" }}>|</span>
                <button onClick={() => clearAllInCategory(perms)} style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Clear all</button>
              </div>
            </div>

            {/* Permission rows */}
            {perms.map((perm) => {
              const desc = PERMISSION_DESCRIPTIONS[perm as keyof typeof PERMISSION_DESCRIPTIONS] ?? perm;
              const roles = ROLE_DEFAULTS_BY_PERMISSION[perm as keyof typeof ROLE_DEFAULTS_BY_PERMISSION] ?? [];
              const checked = permissions.has(perm);

              return (
                <label key={perm} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 20px",
                  cursor: "pointer", borderBottom: "1px solid #fafafa",
                }}>
                  <input
                    type="checkbox" checked={checked} onChange={() => togglePermission(perm)}
                    style={{ width: 16, height: 16, accentColor: "#606e74", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{desc}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", fontFamily: "var(--font-fira, monospace)" }}>{perm}</span>
                    </div>
                    {roles.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                        {roles.map((r) => (
                          <span key={r} style={{
                            fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999,
                            background: "rgba(96,110,116,0.08)", color: "#606e74",
                          }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        ))}
      </div>

      {/* Assigned users panel (edit mode only) */}
      {mode === "edit" && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "white" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>
              Assigned users ({assignedUsers.length})
            </h2>
            <button onClick={() => { setShowAssignModal(true); loadOrgUsers(); }} style={{
              height: 32, padding: "0 14px", background: "#606e74", color: "white", border: "none",
              borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              Assign user
            </button>
          </div>

          {assignedUsers.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No users assigned to this role yet.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <tbody>
                {assignedUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 20px", fontWeight: 500, color: "#111827" }}>{u.name || u.email}</td>
                    <td style={{ padding: "10px 16px", color: "#6b7280" }}>{u.email}</td>
                    <td style={{ padding: "10px 16px", color: "#6b7280" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(96,110,116,0.08)", color: "#606e74" }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <button onClick={() => handleUnassign(u.id)} style={{ color: "#dc2626", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Unassign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Assign user modal */}
      {showAssignModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setShowAssignModal(false)}>
          <div style={{
            background: "white", borderRadius: 12, width: 420, maxHeight: "80vh",
            overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 20px 12px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Assign user to this role</h3>
              <input
                value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Search by name or email..." autoFocus
                style={{ width: "100%", height: 36, border: "1px solid #e5e7eb", borderRadius: 6, padding: "0 12px", fontSize: 13, color: "#111827", fontFamily: "inherit" }}
              />
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", padding: "8px 0" }}>
              {loadingUsers ? (
                <p style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>Loading...</p>
              ) : filteredOrgUsers.length === 0 ? (
                <p style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No matching users</p>
              ) : (
                filteredOrgUsers.map((u) => (
                  <button key={u.id} onClick={() => handleAssign(u.id)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "10px 20px", border: "none", background: "none",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#111827" }}>{u.name || u.email}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{u.email}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "rgba(96,110,116,0.08)", color: "#606e74" }}>{u.role}</span>
                  </button>
                ))
              )}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", textAlign: "right" }}>
              <button onClick={() => setShowAssignModal(false)} style={{
                height: 32, padding: "0 14px", background: "white", color: "#374151",
                border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
