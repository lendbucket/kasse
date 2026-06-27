"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Plus, Trash2, Banknote, CreditCard, MoreHorizontal } from "lucide-react";
import { PoweredBySalonTransact } from "@/components/compliance/PoweredBySalonTransact";
import { CustomerPicker } from "@/components/pos/CustomerPicker";

type Service = { id: string; name: string; price: number; duration: number; category: string | null; locationId: string };
type Staff = { id: string; name: string; locationId: string };
type CartItem = { key: string; serviceId: string; name: string; price: number; staffId: string };
type PaymentMethod = "cash" | "card" | "other";

const FALLBACK_TAX_RATE = 0.0825; // used only if /api/tax has no active row or fails
const ALL_CAT = "All";
function fmt(n: number) { return `$${n.toFixed(2)}`; }

export default function POSPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CAT);
  const [cart, setCart] = useState<CartItem[]>([]);
  // Idempotency key tied to the CART's lifetime (not the button press), so a
  // double-tap on Charge sends the same key and the server dedupes to one order.
  const [cartKey, setCartKey] = useState("");
  const [client, setClient] = useState<{ id: string; name: string } | null>(null);
  const [tipInput, setTipInput] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [charging, setCharging] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number>(FALLBACK_TAX_RATE);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [sr, str] = await Promise.all([fetch("/api/services"), fetch("/api/staff")]);
        if (!sr.ok) throw new Error("Failed to load services");
        const sd = (await sr.json()) as { services: Service[] };
        const std = str.ok ? ((await str.json()) as { staff: Staff[] }) : { staff: [] };
        if (!c) { setServices(sd.services); setStaff(std.staff); }
      } catch (e) { if (!c) setError(e instanceof Error ? e.message : "Load failed"); }
      finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, []);

  useEffect(() => {
    const locId = services[0]?.locationId;
    if (!locId) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/tax?locationId=${encodeURIComponent(locId)}`);
        if (!r.ok) return;
        const d = (await r.json()) as { ratePercent: number | null };
        if (!cancelled && typeof d.ratePercent === "number" && d.ratePercent >= 0) {
          setTaxRate(d.ratePercent / 100);
        }
      } catch { /* network error -> keep fallback */ }
    })();
    return () => { cancelled = true; };
  }, [services]);

  const categories = useMemo(() => { const s = new Set<string>(); services.forEach((sv) => { if (sv.category) s.add(sv.category); }); return [ALL_CAT, ...Array.from(s).sort()]; }, [services]);
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return services.filter((s) => (category === ALL_CAT || s.category === category) && (!q || s.name.toLowerCase().includes(q))); }, [services, search, category]);
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price, 0), [cart]);
  const tax = useMemo(() => +(subtotal * taxRate).toFixed(2), [subtotal, taxRate]);
  const tip = useMemo(() => { const n = parseFloat(tipInput); return Number.isFinite(n) && n > 0 ? +n.toFixed(2) : 0; }, [tipInput]);
  const total = useMemo(() => +(subtotal + tax + tip).toFixed(2), [subtotal, tax, tip]);

  function addToCart(s: Service) {
    setCart((p) => [...p, { key: `${s.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, serviceId: s.id, name: s.name, price: s.price, staffId: "" }]);
    setCartKey((k) => k || ((typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`));
  }
  function setLineStaff(key: string, sid: string) { setCart((p) => p.map((i) => (i.key === key ? { ...i, staffId: sid } : i))); }
  function removeFromCart(key: string) { setCart((p) => p.filter((i) => i.key !== key)); }
  function clearCart() { setCart([]); setClient(null); setTipInput(""); setCartKey(""); }

  async function charge() {
    if (cart.length === 0 || charging) return;
    const locId = services[0]?.locationId;
    if (!locId) { setToast("No location"); return; }
    if (payment === "card") { setToast("Card payments arrive in the next slice"); setTimeout(() => setToast(null), 3000); return; }
    setCharging(true); setToast(null);
    try {
      // cartKey is set on first addToCart, so it's always present here (cart is non-empty).
      // Reuse it so retries / double-taps dedupe server-side; never mint a per-press key.
      if (!cartKey) { setToast("Something went wrong — clear and re-add items"); return; }
      const idempotencyKey = cartKey;
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: locId,
          clientId: client?.id ?? undefined,
          clientName: client?.name ?? undefined,
          items: cart.map((i) => ({ serviceId: i.serviceId, staffId: i.staffId || undefined, quantity: 1 })),
          tipCents: Math.round(tip * 100),
          discountCents: 0,
          method: payment === "cash" ? "CASH" : "OTHER",
          idempotencyKey,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string; orderNumber?: string; totalCents?: number };
      if (!r.ok) throw new Error(data?.error === "card_coming_soon" ? "Card payments arrive in the next slice" : (data?.error || "Charge failed"));
      setToast(`Order ${data.orderNumber} — ${fmt((data.totalCents ?? 0) / 100)} paid`);
      clearCart();
    } catch (e) { setToast(e instanceof Error ? e.message : "Charge failed"); }
    finally { setCharging(false); setTimeout(() => setToast(null), 3500); }
  }

  const iS: React.CSSProperties = { width: "100%", height: 36, borderRadius: 6, border: "1px solid var(--border)", padding: "0 12px", fontSize: 16, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none" };

  return (
    <>
      {/* Header */}
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>TERMINAL</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>Payments &amp; invoices</h1>
        </div>
        {toast && <div style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: 14, color: "var(--text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>{toast}</div>}
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 100px)" }}>
        {/* Left — Services */}
        <div style={{ flex: 1, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Search */}
          <div style={{ padding: 16, borderBottom: "1px solid var(--border)", position: "relative" }}>
            <Search size={16} strokeWidth={1.5} style={{ position: "absolute", left: 28, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services..." style={{ ...iS, height: 40, background: "var(--bg-page)", paddingLeft: 36 }} />
          </div>
          {/* Categories */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 8, overflowX: "auto" }}>
            {categories.map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} style={{
                height: 28, padding: "0 12px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 120ms",
                border: c === category ? "1px solid var(--brand)" : "1px solid var(--border)",
                background: c === category ? "var(--brand)" : "var(--bg-card)",
                color: c === category ? "white" : "var(--text-secondary)",
              }}>{c}</button>
            ))}
          </div>
          {/* Grid */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, alignContent: "start" }}>
            {loading && <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-muted)", padding: 32 }}>Loading services...</p>}
            {error && <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--error)", padding: 32 }}>{error}</p>}
            {!loading && !error && filtered.length === 0 && <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-muted)", padding: 32 }}>No services match</p>}
            {filtered.map((s) => (
              <button key={s.id} type="button" onClick={() => addToCart(s)} style={{
                background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 16, cursor: "pointer", textAlign: "left", transition: "all 150ms", display: "flex", flexDirection: "column",
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span>
                {s.category && <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.category}</span>}
                <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-fira), monospace", color: "var(--brand)", marginTop: 8 }}>{fmt(s.price)}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.duration} min</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Cart */}
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--bg-card)" }}>
          {/* Cart header */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Current Order</span>
            {cart.length > 0 && <button type="button" onClick={clearCart} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--error)", display: "flex", alignItems: "center", gap: 4 }}><Trash2 size={14} /> Clear</button>}
          </div>
          {/* Items */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                <Plus size={24} style={{ margin: "0 auto 8px", color: "var(--border-strong)" }} />
                <p style={{ fontSize: 14 }}>Tap a service to add</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cart.map((item) => (
                  <div key={item.key} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: 13, fontFamily: "var(--font-fira), monospace", color: "var(--text-secondary)", margin: "2px 0 0" }}>{fmt(item.price)}</p>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.key)} aria-label="Remove" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><X size={16} /></button>
                    </div>
                    <select value={item.staffId} onChange={(e) => setLineStaff(item.key, e.target.value)} style={{ ...iS, height: 32, fontSize: 13 }}>
                      <option value="">Stylist (optional)</option>
                      {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Details */}
          <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
            <CustomerPicker locationId={services[0]?.locationId ?? ""} value={client} onChange={setClient} />
          </div>
          {/* Totals */}
          <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary)" }}>Subtotal</span><span style={{ fontFamily: "var(--font-fira), monospace" }}>{fmt(subtotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary)" }}>Tax ({(taxRate * 100).toFixed(2)}%)</span><span style={{ fontFamily: "var(--font-fira), monospace" }}>{fmt(tax)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ color: "var(--text-secondary)" }}>Tip</span><input type="number" inputMode="decimal" min="0" step="0.01" value={tipInput} onChange={(e) => setTipInput(e.target.value)} placeholder="0.00" style={{ width: 80, height: 32, borderRadius: 6, border: "1px solid var(--border)", textAlign: "right", fontSize: 14, fontFamily: "var(--font-fira), monospace", padding: "0 8px", outline: "none", color: "var(--text-primary)" }} /></div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-fira), monospace", color: "var(--text-primary)" }}>{fmt(total)}</span></div>
          </div>
          {/* Payment */}
          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {([["cash", Banknote, "Cash"], ["card", CreditCard, "Card"], ["other", MoreHorizontal, "Other"]] as const).map(([m, Ic, label]) => (
                <button key={m} type="button" onClick={() => setPayment(m)} style={{
                  flex: 1, height: 36, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 120ms",
                  border: payment === m ? "1px solid var(--brand)" : "1px solid var(--border)",
                  background: payment === m ? "var(--brand)" : "var(--bg-card)",
                  color: payment === m ? "white" : "var(--text-secondary)",
                }}><Ic size={14} /> {label}</button>
              ))}
            </div>
            <button type="button" onClick={charge} disabled={cart.length === 0 || charging} style={{
              width: "100%", height: 48, borderRadius: 8, border: "none", fontSize: 16, fontWeight: 700, cursor: cart.length === 0 ? "not-allowed" : "pointer", transition: "all 140ms",
              background: cart.length === 0 ? "var(--border)" : "var(--brand)",
              color: cart.length === 0 ? "var(--text-muted)" : "white",
            }}>{charging ? "Charging..." : `Charge ${fmt(total)}`}</button>
            <PoweredBySalonTransact />
          </div>
        </div>
      </div>
    </>
  );
}
