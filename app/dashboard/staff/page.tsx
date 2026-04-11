"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  Plus,
  Pencil,
  Power,
  Shield,
  Scissors,
  MapPin,
  X,
  Users,
} from "lucide-react";

type Location = { id: string; name: string };

type Role = "manager" | "stylist";

type StaffMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  locationId: string;
  active: boolean;
  location: { id: string; name: string } | null;
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    | { open: false }
    | { open: true; mode: "create" }
    | { open: true; mode: "edit"; member: StaffMember }
  >({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, locRes] = await Promise.all([
        fetch("/api/staff?active=all"),
        fetch("/api/locations"),
      ]);
      if (!staffRes.ok) throw new Error("Failed to load staff");
      const staffData = (await staffRes.json()) as { staff: StaffMember[] };
      const locData = locRes.ok
        ? ((await locRes.json()) as { locations: Location[] })
        : { locations: [] };
      setStaff(staffData.staff);
      setLocations(locData.locations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(member: StaffMember) {
    const nextActive = !member.active;
    const prev = staff;
    setStaff((list) =>
      list.map((s) => (s.id === member.id ? { ...s, active: nextActive } : s)),
    );
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setStaff(prev);
    }
  }

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-[#1a2332] bg-[#0d1117] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#606e74]">
            Team
          </p>
          <h1 className="text-xl font-semibold text-white">Staff</h1>
        </div>

        <button
          type="button"
          onClick={() => setModalState({ open: true, mode: "create" })}
          className="flex items-center gap-2 self-start rounded-lg bg-[#606e74] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96]"
        >
          <Plus size={16} />
          Add Staff Member
        </button>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <StaffList
          loading={loading}
          error={error}
          staff={staff}
          onEdit={(member) => setModalState({ open: true, mode: "edit", member })}
          onToggle={toggleActive}
        />
      </main>

      {modalState.open && (
        <StaffModal
          mode={modalState.mode}
          member={modalState.mode === "edit" ? modalState.member : null}
          locations={locations}
          onClose={() => setModalState({ open: false })}
          onSaved={() => {
            setModalState({ open: false });
            load();
          }}
        />
      )}
    </>
  );
}

function StaffList({
  loading,
  error,
  staff,
  onEdit,
  onToggle,
}: {
  loading: boolean;
  error: string | null;
  staff: StaffMember[];
  onEdit: (member: StaffMember) => void;
  onToggle: (member: StaffMember) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-10 text-center text-sm text-[#606e74]">
        Loading staff...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-[#ef4444]/40 bg-[#ef4444]/5 p-10 text-center text-sm text-[#ef4444]">
        {error}
      </div>
    );
  }
  if (staff.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-12 text-center">
        <Users size={28} className="mx-auto text-[#606e74]" />
        <p className="mt-3 text-sm text-[#7a8f96]">No staff members yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1a2332] bg-[#0d1117]">
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-[#1a2332] text-left text-[10px] uppercase tracking-wider text-[#606e74]">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Role</th>
            <th className="px-5 py-3 font-medium">Location</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Phone</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr
              key={s.id}
              className="border-b border-[#1a2332] last:border-b-0 transition-colors duration-150 hover:bg-[#06080d]"
            >
              <td className="px-5 py-4 text-sm font-medium text-white">
                {s.name}
              </td>
              <td className="px-5 py-4">
                <RoleBadge role={s.role} />
              </td>
              <td className="px-5 py-4 text-sm text-[#7a8f96]">
                {s.location?.name || "—"}
              </td>
              <td className="px-5 py-4 text-sm text-[#7a8f96]">
                {s.email || "—"}
              </td>
              <td className="px-5 py-4 font-mono text-sm text-[#7a8f96]">
                {s.phone || "—"}
              </td>
              <td className="px-5 py-4">
                <StatusBadge active={s.active} />
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <RowButton
                    onClick={() => onEdit(s)}
                    icon={<Pencil size={14} />}
                    label="Edit"
                  />
                  <RowButton
                    onClick={() => onToggle(s)}
                    icon={<Power size={14} />}
                    label={s.active ? "Deactivate" : "Activate"}
                    tone={s.active ? "danger" : "success"}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-3 p-4 lg:hidden">
        {staff.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-3 rounded-lg border border-[#1a2332] bg-[#06080d] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{s.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <RoleBadge role={s.role} />
                  <StatusBadge active={s.active} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-[#7a8f96]">
              {s.location?.name && (
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-[#606e74]" />
                  <span>{s.location.name}</span>
                </div>
              )}
              {s.email && <span>{s.email}</span>}
              {s.phone && <span className="font-mono">{s.phone}</span>}
            </div>
            <div className="flex gap-2">
              <RowButton
                onClick={() => onEdit(s)}
                icon={<Pencil size={14} />}
                label="Edit"
              />
              <RowButton
                onClick={() => onToggle(s)}
                icon={<Power size={14} />}
                label={s.active ? "Deactivate" : "Activate"}
                tone={s.active ? "danger" : "success"}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isManager = role === "manager";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        isManager
          ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
          : "border-[#1a2332] bg-[#06080d] text-[#7a8f96]"
      }`}
    >
      {isManager ? <Shield size={11} /> : <Scissors size={11} />}
      {isManager ? "Manager" : "Stylist"}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
        active
          ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
          : "border-[#606e74]/40 bg-[#606e74]/10 text-[#606e74]"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RowButton({
  onClick,
  icon,
  label,
  tone,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone?: "danger" | "success";
}) {
  const hover =
    tone === "danger"
      ? "hover:border-[#ef4444] hover:text-[#ef4444]"
      : tone === "success"
        ? "hover:border-[#22c55e] hover:text-[#22c55e]"
        : "hover:border-[#606e74] hover:text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-1.5 text-xs font-medium text-[#7a8f96] transition-colors duration-150 ${hover}`}
    >
      {icon}
      {label}
    </button>
  );
}

function StaffModal({
  mode,
  member,
  locations,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  member: StaffMember | null;
  locations: Location[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [role, setRole] = useState<Role>(
    (member?.role as Role) === "manager" ? "manager" : "stylist",
  );
  const [locationId, setLocationId] = useState(
    member?.locationId ?? locations[0]?.id ?? "",
  );
  const [active, setActive] = useState(member?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !locationId || submitting) return;
    setSubmitting(true);
    setErr(null);
    const payload = {
      name,
      email: email || undefined,
      phone: phone || undefined,
      role,
      locationId,
      active,
    };
    try {
      const res = await fetch(
        mode === "edit" ? `/api/staff/${member!.id}` : "/api/staff",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex w-full flex-col overflow-hidden border-t border-[#1a2332] bg-[#0d1117] sm:max-w-md sm:rounded-2xl sm:border">
        <div className="flex items-center justify-between border-b border-[#1a2332] px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            {mode === "edit" ? "Edit Staff" : "Add Staff Member"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#606e74] transition-colors duration-150 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5"
        >
          <Field label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="kasse-input"
              placeholder="Full name"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="kasse-input"
              placeholder="name@example.com"
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="kasse-input font-mono"
              placeholder="(555) 555-5555"
            />
          </Field>

          <Field label="Role">
            <div className="grid grid-cols-2 gap-2">
              <RolePick
                active={role === "manager"}
                onClick={() => setRole("manager")}
                icon={<Shield size={14} />}
                label="Manager"
              />
              <RolePick
                active={role === "stylist"}
                onClick={() => setRole("stylist")}
                icon={<Scissors size={14} />}
                label="Stylist"
              />
            </div>
          </Field>

          <Field label="Location">
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="kasse-input"
              required
            >
              <option value="">Select a location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-[#1a2332] bg-[#06080d] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Active</p>
              <p className="text-[10px] uppercase tracking-wider text-[#606e74]">
                Inactive staff are hidden from POS
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-150 ${
                active ? "bg-[#22c55e]" : "bg-[#1a2332]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-150 ${
                  active ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {err && (
            <p className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/5 px-3 py-2 text-xs text-[#ef4444]">
              {err}
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#1a2332] bg-[#06080d] px-4 py-3 text-sm font-medium text-[#7a8f96] transition-colors duration-150 hover:border-[#606e74] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !locationId || submitting}
              className="flex-1 rounded-lg bg-[#606e74] px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .kasse-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #1a2332;
          background: #06080d;
          padding: 0.625rem 0.75rem;
          font-size: 16px;
          color: #ffffff;
          outline: none;
          transition: border-color 150ms;
        }
        .kasse-input:focus {
          border-color: #7a8f96;
        }
        .kasse-input::placeholder {
          color: #606e74;
        }
      `}</style>
    </div>
  );
}

function RolePick({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
        active
          ? "border-[#606e74] bg-[#06080d] text-white"
          : "border-[#1a2332] bg-[#06080d] text-[#7a8f96] hover:border-[#606e74] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[#606e74]">
        {label}
        {required && <span className="ml-1 text-[#ef4444]">*</span>}
      </span>
      {children}
    </label>
  );
}
