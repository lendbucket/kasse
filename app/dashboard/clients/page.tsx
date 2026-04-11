"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Search,
  Plus,
  X,
  Eye,
  Pencil,
  Mail,
  Phone,
  User,
  Users,
} from "lucide-react";

type ClientListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  locationId: string;
  visitCount: number;
  lastVisit: string | null;
};

type AppointmentHistoryItem = {
  id: string;
  startTime: string;
  status: string;
  serviceName: string | null;
  price: number | null;
  staff: { name: string } | null;
};

type ClientDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  locationId: string;
  totalSpent: number;
  appointments: AppointmentHistoryItem[];
};

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const DATETIME_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadLocation() {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) return;
        const data = (await res.json()) as {
          services: { locationId: string }[];
        };
        if (!cancelled && data.services[0]) {
          setLocationId(data.services[0].locationId);
        }
      } catch {
        // ignore
      }
    }
    loadLocation();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (locationId) params.set("locationId", locationId);
      const res = await fetch(`/api/clients?${params}`);
      if (!res.ok) throw new Error("Failed to load clients");
      const data = (await res.json()) as { clients: ClientListItem[] };
      setClients(data.clients);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [query, locationId]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadClients();
    }, 200);
    return () => clearTimeout(t);
  }, [loadClients]);

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-[#1a2332] bg-[#0d1117] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#606e74]">
            Directory
          </p>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#606e74]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone"
              className="w-full rounded-lg border border-[#1a2332] bg-[#06080d] py-2.5 pl-9 pr-3 text-base text-white placeholder:text-[#606e74] outline-none transition-colors duration-150 focus:border-[#7a8f96]"
            />
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#606e74] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96]"
          >
            <Plus size={16} />
            New Client
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <ClientList
          loading={loading}
          error={error}
          clients={clients}
          onView={(id) => {
            setEditMode(false);
            setOpenClientId(id);
          }}
          onEdit={(id) => {
            setEditMode(true);
            setOpenClientId(id);
          }}
        />
      </main>

      {modalOpen && (
        <NewClientModal
          locationId={locationId}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            loadClients();
          }}
        />
      )}

      {openClientId && (
        <ClientDetailDrawer
          clientId={openClientId}
          startInEdit={editMode}
          onClose={() => setOpenClientId(null)}
          onSaved={loadClients}
        />
      )}
    </>
  );
}

function ClientList({
  loading,
  error,
  clients,
  onView,
  onEdit,
}: {
  loading: boolean;
  error: string | null;
  clients: ClientListItem[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-10 text-center text-sm text-[#606e74]">
        Loading clients...
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
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1117] p-12 text-center">
        <Users size={28} className="mx-auto text-[#606e74]" />
        <p className="mt-3 text-sm text-[#7a8f96]">No clients yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1a2332] bg-[#0d1117]">
      <table className="hidden w-full lg:table">
        <thead>
          <tr className="border-b border-[#1a2332] text-left text-[10px] uppercase tracking-wider text-[#606e74]">
            <th className="px-5 py-3 font-medium">Name</th>
            <th className="px-5 py-3 font-medium">Phone</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Visits</th>
            <th className="px-5 py-3 font-medium">Last Visit</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr
              key={c.id}
              className="border-b border-[#1a2332] last:border-b-0 transition-colors duration-150 hover:bg-[#06080d]"
            >
              <td className="px-5 py-4 text-sm font-medium text-white">
                {c.name}
              </td>
              <td className="px-5 py-4 font-mono text-sm text-[#7a8f96]">
                {c.phone || "—"}
              </td>
              <td className="px-5 py-4 text-sm text-[#7a8f96]">
                {c.email || "—"}
              </td>
              <td className="px-5 py-4 font-mono text-sm text-white">
                {c.visitCount}
              </td>
              <td className="px-5 py-4 font-mono text-sm text-[#7a8f96]">
                {c.lastVisit ? DATE_FMT.format(new Date(c.lastVisit)) : "—"}
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <RowButton onClick={() => onView(c.id)} icon={<Eye size={14} />} label="View" />
                  <RowButton onClick={() => onEdit(c.id)} icon={<Pencil size={14} />} label="Edit" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="flex flex-col gap-3 p-4 lg:hidden">
        {clients.map((c) => (
          <li
            key={c.id}
            className="flex flex-col gap-3 rounded-lg border border-[#1a2332] bg-[#06080d] p-4"
          >
            <div>
              <p className="text-base font-semibold text-white">{c.name}</p>
              <div className="mt-1 flex flex-col gap-0.5 text-xs text-[#7a8f96]">
                {c.phone && (
                  <span className="font-mono">{c.phone}</span>
                )}
                {c.email && <span>{c.email}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-[#606e74]">
              <span className="font-mono">
                {c.visitCount} visit{c.visitCount === 1 ? "" : "s"}
              </span>
              <span className="font-mono">
                {c.lastVisit ? DATE_FMT.format(new Date(c.lastVisit)) : "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <RowButton onClick={() => onView(c.id)} icon={<Eye size={14} />} label="View" />
              <RowButton onClick={() => onEdit(c.id)} icon={<Pencil size={14} />} label="Edit" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RowButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-1.5 text-xs font-medium text-[#7a8f96] transition-colors duration-150 hover:border-[#606e74] hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}

function NewClientModal({
  locationId,
  onClose,
  onCreated,
}: {
  locationId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    if (!locationId) {
      setErr("No location available");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          notes: notes || undefined,
          locationId,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Create failed");
      }
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <div className="flex w-full flex-col overflow-hidden border-t border-[#1a2332] bg-[#0d1117] sm:max-w-md sm:rounded-2xl sm:border">
        <div className="flex items-center justify-between border-b border-[#1a2332] px-5 py-4">
          <h2 className="text-base font-semibold text-white">New Client</h2>
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
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="kasse-input"
              placeholder="jane@example.com"
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
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="kasse-input resize-none"
              placeholder="Optional"
            />
          </Field>

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
              disabled={!name.trim() || submitting}
              className="flex-1 rounded-lg bg-[#606e74] px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
      <InputStyles />
    </div>
  );
}

function ClientDetailDrawer({
  clientId,
  startInEdit,
  onClose,
  onSaved,
}: {
  clientId: string;
  startInEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [edit, setEdit] = useState(startInEdit);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedClientId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    fetch(`/api/clients/${clientId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json() as Promise<{ client: ClientDetail }>;
      })
      .then((data) => {
        if (cancelled) return;
        setDetail(data.client);
        setName(data.client.name);
        setEmail(data.client.email ?? "");
        setPhone(data.client.phone ?? "");
        setNotes(data.client.notes ?? "");
        loadedClientId.current = clientId;
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Load failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  function onNotesChange(v: string) {
    setNotes(v);
    if (loadedClientId.current !== clientId) return;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      setNotesSaving(true);
      try {
        await fetch(`/api/clients/${clientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: v }),
        });
        onSaved();
      } finally {
        setNotesSaving(false);
      }
    }, 600);
  }

  async function saveFields() {
    if (!name.trim()) return;
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone }),
    });
    if (res.ok) {
      setEdit(false);
      onSaved();
      const data = (await res.json()) as { client: ClientDetail };
      setDetail((prev) => (prev ? { ...prev, ...data.client } : prev));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-[#1a2332] bg-[#0d1117]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#1a2332] px-5 py-4">
          <h2 className="text-base font-semibold text-white">Client Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[#606e74] transition-colors duration-150 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-6 text-sm text-[#606e74]">Loading...</div>
          )}
          {err && (
            <div className="m-4 rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/5 p-4 text-xs text-[#ef4444]">
              {err}
            </div>
          )}
          {detail && !loading && (
            <div className="flex flex-col gap-6 p-5">
              <section className="flex flex-col gap-3 rounded-xl border border-[#1a2332] bg-[#06080d] p-5">
                {edit ? (
                  <>
                    <Field label="Name" required>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="kasse-input"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="kasse-input"
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="kasse-input font-mono"
                      />
                    </Field>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEdit(false);
                          setName(detail.name);
                          setEmail(detail.email ?? "");
                          setPhone(detail.phone ?? "");
                        }}
                        className="flex-1 rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-2 text-xs font-medium text-[#7a8f96] transition-colors duration-150 hover:border-[#606e74] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveFields}
                        className="flex-1 rounded-lg bg-[#606e74] px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96]"
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#1a2332] bg-[#0d1117]">
                          <User size={16} className="text-[#7a8f96]" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-white">
                            {detail.name}
                          </p>
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[#606e74]">
                            {detail.appointments.length} recent visit
                            {detail.appointments.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEdit(true)}
                        className="flex items-center gap-1 rounded-lg border border-[#1a2332] bg-[#0d1117] px-3 py-1.5 text-xs font-medium text-[#7a8f96] transition-colors duration-150 hover:border-[#606e74] hover:text-white"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 text-sm text-[#7a8f96]">
                      {detail.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-[#606e74]" />
                          <span className="font-mono">{detail.phone}</span>
                        </div>
                      )}
                      {detail.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-[#606e74]" />
                          <span>{detail.email}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>

              <section className="rounded-xl border border-[#1a2332] bg-[#06080d] p-5">
                <p className="text-[10px] uppercase tracking-wider text-[#606e74]">
                  Total Spent
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold text-white">
                  {formatUSD(detail.totalSpent)}
                </p>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#606e74]">
                  Appointment History
                </h3>
                {detail.appointments.length === 0 ? (
                  <div className="rounded-xl border border-[#1a2332] bg-[#06080d] p-6 text-center text-xs text-[#606e74]">
                    No appointments yet
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {detail.appointments.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-[#1a2332] bg-[#06080d] px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {a.serviceName || "Service"}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-wider text-[#606e74]">
                              {DATETIME_FMT.format(new Date(a.startTime))}
                              {a.staff?.name ? ` · ${a.staff.name}` : ""}
                            </p>
                          </div>
                          {a.price !== null && (
                            <span className="font-mono text-sm text-[#7a8f96]">
                              {formatUSD(a.price)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#606e74]">
                    Notes
                  </h3>
                  <span className="text-[10px] text-[#606e74]">
                    {notesSaving ? "Saving..." : "Auto-saves"}
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={5}
                  placeholder="Add notes about this client..."
                  className="kasse-input resize-none"
                />
              </section>
            </div>
          )}
        </div>
      </div>
      <InputStyles />
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

function InputStyles() {
  return (
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
  );
}
