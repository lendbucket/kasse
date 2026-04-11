"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Plus, Pencil, Power, Wrench, X } from "lucide-react";

type Location = { id: string; name: string };

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string | null;
  locationId: string;
  active: boolean;
};

const ALL_CATEGORY = "All";
const CATEGORY_SUGGESTIONS = [
  "Hair",
  "Color",
  "Treatment",
  "Nails",
  "Waxing",
  "Other",
];

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [modalState, setModalState] = useState<
    | { open: false }
    | { open: true; mode: "create" }
    | { open: true; mode: "edit"; service: Service }
  >({ open: false });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svcRes, locRes] = await Promise.all([
        fetch("/api/services?active=all"),
        fetch("/api/locations"),
      ]);
      if (!svcRes.ok) throw new Error("Failed to load services");
      const svcData = (await svcRes.json()) as { services: Service[] };
      const locData = locRes.ok
        ? ((await locRes.json()) as { locations: Location[] })
        : { locations: [] };
      setServices(svcData.services);
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return [ALL_CATEGORY, ...Array.from(set).sort()];
  }, [services]);

  const filtered = useMemo(() => {
    if (category === ALL_CATEGORY) return services;
    return services.filter((s) => s.category === category);
  }, [services, category]);

  async function toggleActive(service: Service) {
    const next = !service.active;
    const prev = services;
    setServices((list) =>
      list.map((s) => (s.id === service.id ? { ...s, active: next } : s)),
    );
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setServices(prev);
    }
  }

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-[#1a2332] bg-[#0d1117] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#606e74]">
            Menu
          </p>
          <h1 className="text-xl font-semibold text-white">Services</h1>
        </div>

        <button
          type="button"
          onClick={() => setModalState({ open: true, mode: "create" })}
          className="flex items-center gap-2 self-start rounded-lg bg-[#606e74] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96]"
        >
          <Plus size={16} />
          Add Service
        </button>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "border-[#606e74] bg-[#06080d] text-white"
                    : "border-[#1a2332] bg-[#0d1117] text-[#7a8f96] hover:border-[#606e74] hover:text-white"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <ServicesList
          loading={loading}
          error={error}
          services={filtered}
          onEdit={(service) =>
            setModalState({ open: true, mode: "edit", service })
          }
          onToggle={toggleActive}
        />
      </main>

      {modalState.open && (
        <ServiceModal
          mode={modalState.mode}
          service={modalState.mode === "edit" ? modalState.service : null}
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

function ServicesList({
  loading,
  error,
  services,
  onEdit,
  onToggle,
}: {
  loading: boolean;
  error: string | null;
  services: Service[];
  onEdit: (service: Service) => void;
  onToggle: (service: Service) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-10 text-center text-sm text-[#606e74]">
        Loading services...
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
  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-12 text-center">
        <Wrench size={28} className="mx-auto text-[#606e74]" />
        <p className="mt-3 text-sm text-[#7a8f96]">No services yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1a2332] bg-[#0d1117]">
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-[#1a2332] text-left text-[10px] uppercase tracking-wider text-[#606e74]">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Category</th>
            <th className="px-5 py-3 font-medium">Price</th>
            <th className="px-5 py-3 font-medium">Duration</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr
              key={s.id}
              className="border-b border-[#1a2332] last:border-b-0 transition-colors duration-150 hover:bg-[#06080d]"
            >
              <td className="px-5 py-4 text-sm font-medium text-white">
                {s.name}
              </td>
              <td className="px-5 py-4 text-sm text-[#7a8f96]">
                {s.category || "—"}
              </td>
              <td className="px-5 py-4 font-mono text-sm text-white">
                {formatUSD(s.price)}
              </td>
              <td className="px-5 py-4 font-mono text-sm text-[#7a8f96]">
                {s.duration} min
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
        {services.map((s) => (
          <li
            key={s.id}
            className="flex flex-col gap-3 rounded-lg border border-[#1a2332] bg-[#06080d] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">{s.name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#606e74]">
                  {s.category || "Uncategorized"}
                </p>
              </div>
              <StatusBadge active={s.active} />
            </div>
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="text-white">{formatUSD(s.price)}</span>
              <span className="text-[#7a8f96]">{s.duration} min</span>
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

function ServiceModal({
  mode,
  service,
  locations,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  service: Service | null;
  locations: Location[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState(service?.category ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [duration, setDuration] = useState(
    service ? String(service.duration) : "",
  );
  const [locationId, setLocationId] = useState(
    service?.locationId ?? locations[0]?.id ?? "",
  );
  const [active, setActive] = useState(service?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const priceNum = parseFloat(price);
    const durationNum = parseInt(duration, 10);
    if (!name.trim() || !locationId || submitting) return;
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setErr("Invalid price");
      return;
    }
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      setErr("Invalid duration");
      return;
    }
    setSubmitting(true);
    setErr(null);
    const payload = {
      name,
      category: category || null,
      price: priceNum,
      duration: durationNum,
      locationId,
      active,
    };
    try {
      const res = await fetch(
        mode === "edit" ? `/api/services/${service!.id}` : "/api/services",
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
            {mode === "edit" ? "Edit Service" : "Add Service"}
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
              placeholder="Haircut"
            />
          </Field>

          <Field label="Category">
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-suggestions"
              className="kasse-input"
              placeholder="Hair"
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price ($)" required>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="kasse-input font-mono"
                placeholder="0.00"
              />
            </Field>
            <Field label="Duration (min)" required>
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="kasse-input font-mono"
                placeholder="45"
              />
            </Field>
          </div>

          <Field label="Location" required>
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
                Inactive services are hidden from POS
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
