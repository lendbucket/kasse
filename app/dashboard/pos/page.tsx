"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  X,
  Plus,
  Trash2,
  Banknote,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string | null;
  locationId: string;
};

type Staff = {
  id: string;
  name: string;
  locationId: string;
};

type CartItem = {
  key: string;
  serviceId: string;
  name: string;
  price: number;
};

type PaymentMethod = "cash" | "card" | "other";

const TAX_RATE = 0.0825;
const ALL_CATEGORY = "All";

function formatUSD(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function POSPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORY);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [staffId, setStaffId] = useState("");
  const [clientName, setClientName] = useState("");
  const [tipInput, setTipInput] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [svcRes, staffRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/staff"),
        ]);
        if (!svcRes.ok) throw new Error("Failed to load services");
        const svcData = (await svcRes.json()) as { services: Service[] };
        const staffData = staffRes.ok
          ? ((await staffRes.json()) as { staff: Staff[] })
          : { staff: [] };
        if (cancelled) return;
        setServices(svcData.services);
        setStaff(staffData.staff);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return [ALL_CATEGORY, ...Array.from(set).sort()];
  }, [services]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      const catOk = category === ALL_CATEGORY || s.category === category;
      const qOk = !q || s.name.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [services, search, category]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price, 0),
    [cart],
  );
  const tax = useMemo(() => +(subtotal * TAX_RATE).toFixed(2), [subtotal]);
  const tip = useMemo(() => {
    const n = parseFloat(tipInput);
    return Number.isFinite(n) && n > 0 ? +n.toFixed(2) : 0;
  }, [tipInput]);
  const total = useMemo(() => +(subtotal + tax + tip).toFixed(2), [subtotal, tax, tip]);

  function addToCart(service: Service) {
    setCart((prev) => [
      ...prev,
      {
        key: `${service.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        serviceId: service.id,
        name: service.name,
        price: service.price,
      },
    ]);
  }

  function removeFromCart(key: string) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  function clearCart() {
    setCart([]);
    setClientName("");
    setTipInput("");
    setStaffId("");
  }

  async function charge() {
    if (cart.length === 0 || charging) return;
    const locationId = services[0]?.locationId;
    if (!locationId) {
      setToast("No location available");
      return;
    }
    setCharging(true);
    setToast(null);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          staffId: staffId || undefined,
          clientName: clientName.trim() || undefined,
          amount: subtotal,
          tax,
          tip,
          total,
          paymentMethod: payment,
        }),
      });
      if (!res.ok) throw new Error("Charge failed");
      setToast(`Charged ${formatUSD(total)}`);
      clearCart();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Charge failed");
    } finally {
      setCharging(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <>
      <header className="flex items-center justify-between border-b border-[#1a2332] bg-[#0d1117] px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#606e74]">
            Terminal
          </p>
          <h1 className="text-xl font-semibold text-white">POS</h1>
        </div>
        {toast && (
          <div className="rounded-lg border border-[#1a2332] bg-[#06080d] px-4 py-2 text-sm text-[#7a8f96]">
            {toast}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <section className="flex flex-col gap-4">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#606e74]"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search services"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0d1117] py-3 pl-11 pr-4 text-base text-white placeholder:text-[#606e74] outline-none transition-colors duration-150 focus:border-[#7a8f96]"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {loading && (
                <p className="col-span-full text-sm text-[#606e74]">
                  Loading services...
                </p>
              )}
              {error && !loading && (
                <p className="col-span-full text-sm text-[#ef4444]">{error}</p>
              )}
              {!loading && !error && filteredServices.length === 0 && (
                <p className="col-span-full text-sm text-[#606e74]">
                  No services match
                </p>
              )}
              {filteredServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => addToCart(s)}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-[#1a2332] bg-[#0d1117] p-4 text-left transition-colors duration-150 hover:border-[#606e74] hover:bg-[#1a2332]"
                >
                  <span className="text-sm font-semibold text-white">
                    {s.name}
                  </span>
                  {s.category && (
                    <span className="text-[10px] uppercase tracking-wider text-[#606e74]">
                      {s.category}
                    </span>
                  )}
                  <span className="mt-auto font-mono text-lg font-semibold text-[#7a8f96] group-hover:text-white">
                    {formatUSD(s.price)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <aside className="flex flex-col rounded-xl border border-[#1a2332] bg-[#0d1117]">
            <div className="flex items-center justify-between border-b border-[#1a2332] px-5 py-4">
              <h2 className="text-sm font-semibold text-white">Current Order</h2>
              <span className="font-mono text-xs text-[#606e74]">
                {cart.length} item{cart.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="max-h-[260px] flex-1 overflow-y-auto px-5 py-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <Plus size={22} className="text-[#606e74]" />
                  <p className="text-xs text-[#606e74]">
                    Tap a service to add
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cart.map((item) => (
                    <li
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-2"
                    >
                      <span className="truncate text-sm text-white">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-[#7a8f96]">
                          {formatUSD(item.price)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.key)}
                          aria-label="Remove"
                          className="text-[#606e74] transition-colors duration-150 hover:text-[#ef4444]"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[#1a2332] px-5 py-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#606e74]">
                  Stylist
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-2 text-base text-white outline-none transition-colors duration-150 focus:border-[#7a8f96]"
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#606e74]">
                  Client (optional)
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Walk-in"
                  className="w-full rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-2 text-base text-white placeholder:text-[#606e74] outline-none transition-colors duration-150 focus:border-[#7a8f96]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#606e74]">
                  Tip
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={tipInput}
                  onChange={(e) => setTipInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#1a2332] bg-[#06080d] px-3 py-2 text-base font-mono text-white placeholder:text-[#606e74] outline-none transition-colors duration-150 focus:border-[#7a8f96]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-[#1a2332] px-5 py-4 font-mono text-sm">
              <Row label="Subtotal" value={formatUSD(subtotal)} />
              <Row label={`Tax (${(TAX_RATE * 100).toFixed(2)}%)`} value={formatUSD(tax)} />
              <Row label="Tip" value={formatUSD(tip)} />
              <div className="mt-2 flex items-center justify-between border-t border-[#1a2332] pt-2">
                <span className="text-sm text-[#7a8f96]">Total</span>
                <span className="text-xl font-semibold text-white">
                  {formatUSD(total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#1a2332] px-5 py-4">
              <div className="grid grid-cols-3 gap-2">
                <PayButton
                  active={payment === "cash"}
                  onClick={() => setPayment("cash")}
                  icon={<Banknote size={16} />}
                  label="Cash"
                />
                <PayButton
                  active={payment === "card"}
                  onClick={() => setPayment("card")}
                  icon={<CreditCard size={16} />}
                  label="Card"
                />
                <PayButton
                  active={payment === "other"}
                  onClick={() => setPayment("other")}
                  icon={<MoreHorizontal size={16} />}
                  label="Other"
                />
              </div>

              <button
                type="button"
                onClick={charge}
                disabled={cart.length === 0 || charging}
                className="w-full rounded-lg bg-[#606e74] px-4 py-4 text-base font-semibold text-white transition-colors duration-150 hover:bg-[#7a8f96] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {charging ? "Charging..." : `Charge ${formatUSD(total)}`}
              </button>

              <button
                type="button"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-[#606e74] transition-colors duration-150 hover:border-[#1a2332] hover:text-[#ef4444] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={14} />
                Clear Cart
              </button>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#606e74]">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function PayButton({
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
      className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3 text-xs font-medium transition-colors duration-150 ${
        active
          ? "border-[#606e74] bg-[#06080d] text-white"
          : "border-[#1a2332] bg-[#0d1117] text-[#7a8f96] hover:border-[#606e74] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
