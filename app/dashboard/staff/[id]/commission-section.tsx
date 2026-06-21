"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Layers, Percent, Plus, Trash2 } from "lucide-react";
import type { StaffMember } from "./types";

type EligibleService = { serviceId: string; name: string; category: string | null; basePriceCents: number };
type ModelType = "flat" | "tiered";
type OverrideType = "none" | "percent" | "flat";
type BandInput = { uid: string; thresholdDollars: string; ratePct: string };
type PerServiceInput = { type: OverrideType; value: string };

type CompensationRow = {
  modelType: string;
  baseCommissionPct: number | null;
  tieredCommissionConfig: unknown;
  perServiceCommissionOverrides: unknown;
};

export default function CommissionSection({ staffId, staff }: { staffId: string; staff: StaffMember }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Data from GET
  const [eligibleServices, setEligibleServices] = useState<EligibleService[]>([]);
  const [staffDefaultRate, setStaffDefaultRate] = useState(40);

  // Working state
  const [modelType, setModelType] = useState<ModelType>("flat");
  const [basePct, setBasePct] = useState("");
  const [tieredMode, setTieredMode] = useState<"marginal" | "whole">("whole");
  const [bands, setBands] = useState<BandInput[]>([{ uid: crypto.randomUUID(), thresholdDollars: "0", ratePct: "35" }]);
  const [perServiceInputs, setPerServiceInputs] = useState<Record<string, PerServiceInput>>({});

  // Snapshot for dirty tracking
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const currentSnapshot = useMemo(() => JSON.stringify({ modelType, basePct, tieredMode, bands: bands.map(({ thresholdDollars, ratePct }) => ({ thresholdDollars, ratePct })), perServiceInputs }), [modelType, basePct, tieredMode, bands, perServiceInputs]);
  const isDirty = currentSnapshot !== savedSnapshot;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/staff/${staffId}/compensation`);
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as {
        compensation: CompensationRow | null;
        eligibleServices: EligibleService[];
        staffDefaultRatePct: number;
      };

      setEligibleServices(data.eligibleServices);
      setStaffDefaultRate(data.staffDefaultRatePct);

      // Initialize from existing compensation
      const comp = data.compensation;
      if (comp) {
        const mt = comp.modelType === "tiered" ? "tiered" : "flat";
        setModelType(mt);
        setBasePct(comp.baseCommissionPct != null ? String(comp.baseCommissionPct) : "");

        // Tiered config
        if (comp.tieredCommissionConfig && typeof comp.tieredCommissionConfig === "object" && !Array.isArray(comp.tieredCommissionConfig)) {
          const tc = comp.tieredCommissionConfig as { mode?: string; bands?: Array<{ thresholdCents: number; ratePct: number }> };
          if (tc.mode === "marginal" || tc.mode === "whole") setTieredMode(tc.mode);
          if (Array.isArray(tc.bands) && tc.bands.length > 0) {
            setBands(tc.bands.map((b) => ({
              uid: crypto.randomUUID(),
              thresholdDollars: (b.thresholdCents / 100).toFixed(2),
              ratePct: String(b.ratePct),
            })));
          }
        }

        // Per-service overrides
        if (comp.perServiceCommissionOverrides && typeof comp.perServiceCommissionOverrides === "object") {
          const ovr = comp.perServiceCommissionOverrides as Record<string, { type: string; value?: number; valueCents?: number }>;
          const inputs: Record<string, PerServiceInput> = {};
          for (const svc of data.eligibleServices) {
            const o = ovr[svc.serviceId];
            if (o?.type === "percent" && o.value != null) {
              inputs[svc.serviceId] = { type: "percent", value: String(o.value) };
            } else if (o?.type === "flat" && o.valueCents != null) {
              inputs[svc.serviceId] = { type: "flat", value: (o.valueCents / 100).toFixed(2) };
            } else {
              inputs[svc.serviceId] = { type: "none", value: "" };
            }
          }
          setPerServiceInputs(inputs);
        } else {
          // No overrides
          const inputs: Record<string, PerServiceInput> = {};
          for (const svc of data.eligibleServices) inputs[svc.serviceId] = { type: "none", value: "" };
          setPerServiceInputs(inputs);
        }
      } else {
        // No compensation row yet
        const inputs: Record<string, PerServiceInput> = {};
        for (const svc of data.eligibleServices) inputs[svc.serviceId] = { type: "none", value: "" };
        setPerServiceInputs(inputs);
      }

      // Compute snapshot synchronously from loaded data (not React state) to avoid
      // setTimeout races with StrictMode double-invoke or rapid remounts.
      const snapshotModelType: ModelType = comp?.modelType === "tiered" ? "tiered" : "flat";
      const snapshotBasePct = comp?.baseCommissionPct != null ? String(comp.baseCommissionPct) : "";
      let snapshotTieredMode: "marginal" | "whole" = "whole";
      let snapshotBands: Array<{ thresholdDollars: string; ratePct: string }> = [{ thresholdDollars: "0", ratePct: "35" }];
      if (comp?.tieredCommissionConfig && typeof comp.tieredCommissionConfig === "object" && !Array.isArray(comp.tieredCommissionConfig)) {
        const tc = comp.tieredCommissionConfig as { mode?: string; bands?: Array<{ thresholdCents: number; ratePct: number }> };
        if (tc.mode === "marginal" || tc.mode === "whole") snapshotTieredMode = tc.mode;
        if (Array.isArray(tc.bands) && tc.bands.length > 0) {
          snapshotBands = tc.bands.map((b) => ({ thresholdDollars: (b.thresholdCents / 100).toFixed(2), ratePct: String(b.ratePct) }));
        }
      }
      const snapshotPerService: Record<string, PerServiceInput> = {};
      if (comp?.perServiceCommissionOverrides && typeof comp.perServiceCommissionOverrides === "object") {
        const ovr = comp.perServiceCommissionOverrides as Record<string, { type: string; value?: number; valueCents?: number }>;
        for (const svc of data.eligibleServices) {
          const o = ovr[svc.serviceId];
          if (o?.type === "percent" && o.value != null) snapshotPerService[svc.serviceId] = { type: "percent", value: String(o.value) };
          else if (o?.type === "flat" && o.valueCents != null) snapshotPerService[svc.serviceId] = { type: "flat", value: (o.valueCents / 100).toFixed(2) };
          else snapshotPerService[svc.serviceId] = { type: "none", value: "" };
        }
      } else {
        for (const svc of data.eligibleServices) snapshotPerService[svc.serviceId] = { type: "none", value: "" };
      }
      setSavedSnapshot(JSON.stringify({
        modelType: snapshotModelType,
        basePct: snapshotBasePct,
        tieredMode: snapshotTieredMode,
        bands: snapshotBands,
        perServiceInputs: snapshotPerService,
      }));
    } catch (e) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  }, [staffId]);

  useEffect(() => { load(); }, [load]);

  // Validation
  const validationErrors = useMemo(() => {
    const errs: string[] = [];
    if (modelType === "flat") {
      if (basePct.trim() !== "") {
        const n = parseFloat(basePct);
        if (isNaN(n) || n < 0 || n > 100) errs.push("Base commission must be 0–100%");
      }
    }
    if (modelType === "tiered") {
      if (bands.length === 0) errs.push("At least one tier band is required");
      const thresholds = new Set<number>();
      for (let i = 0; i < bands.length; i++) {
        const b = bands[i];
        const t = parseFloat(b.thresholdDollars);
        const r = parseFloat(b.ratePct);
        if (isNaN(t) || t < 0) errs.push(`Band ${i + 1}: threshold must be ≥ $0`);
        if (isNaN(r) || r < 0 || r > 100) errs.push(`Band ${i + 1}: rate must be 0–100%`);
        const tCents = Math.round(t * 100);
        if (!isNaN(t) && thresholds.has(tCents)) errs.push(`Band ${i + 1}: duplicate threshold`);
        thresholds.add(tCents);
      }
    }
    for (const [, inp] of Object.entries(perServiceInputs)) {
      if (inp.type === "percent") {
        const n = parseFloat(inp.value);
        if (isNaN(n) || n < 0 || n > 100) errs.push("Per-service percent must be 0–100");
      } else if (inp.type === "flat") {
        const n = parseFloat(inp.value);
        if (isNaN(n) || n < 0) errs.push("Per-service flat must be ≥ $0");
      }
    }
    return errs;
  }, [modelType, basePct, bands, perServiceInputs]);

  const hasErrors = validationErrors.length > 0;

  async function handleSave() {
    if (hasErrors) return;
    setSaving(true); setSaveMsg(null);

    // Capture the snapshot BEFORE the await so edits during the in-flight save stay dirty
    const snapshotAtSave = currentSnapshot;

    // Build body
    const tieredConfig = modelType === "tiered" ? {
      mode: tieredMode,
      bands: bands.map((b) => ({
        thresholdCents: Math.round(parseFloat(b.thresholdDollars) * 100),
        ratePct: parseFloat(b.ratePct),
      })),
    } : null;

    const perServiceOverrides: Record<string, unknown> = {};
    for (const [serviceId, inp] of Object.entries(perServiceInputs)) {
      if (inp.type === "percent") {
        perServiceOverrides[serviceId] = { type: "percent", value: parseFloat(inp.value) };
      } else if (inp.type === "flat") {
        perServiceOverrides[serviceId] = { type: "flat", valueCents: Math.round(parseFloat(inp.value) * 100) };
      }
    }

    try {
      const res = await fetch(`/api/staff/${staffId}/compensation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType,
          baseCommissionPct: modelType === "flat" && basePct.trim() !== "" ? parseFloat(basePct) : null,
          tieredConfig,
          perServiceOverrides: Object.keys(perServiceOverrides).length > 0 ? perServiceOverrides : null,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error || "Save failed");
      }
      setSaveMsg("Saved");
      setSavedSnapshot(snapshotAtSave);
    } catch (e) { setSaveMsg(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  }

  // Band helpers
  function addBand() {
    setSaveMsg(null);
    const lastThreshold = bands.length > 0 ? parseFloat(bands[bands.length - 1].thresholdDollars) || 0 : 0;
    setBands([...bands, { uid: crypto.randomUUID(), thresholdDollars: String(lastThreshold + 1000), ratePct: "40" }]);
  }
  function removeBand(i: number) { setSaveMsg(null); setBands(bands.filter((_, idx) => idx !== i)); }
  function updateBand(i: number, field: "thresholdDollars" | "ratePct", value: string) {
    setSaveMsg(null);
    setBands(bands.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  }

  // Per-service helpers
  function setOverrideType(serviceId: string, type: OverrideType) {
    setSaveMsg(null);
    setPerServiceInputs((prev) => ({ ...prev, [serviceId]: { type, value: type === "none" ? "" : prev[serviceId]?.value || "" } }));
  }
  function setOverrideValue(serviceId: string, value: string) {
    setSaveMsg(null);
    setPerServiceInputs((prev) => ({ ...prev, [serviceId]: { ...prev[serviceId], value } }));
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading commission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: "48px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--error)" }}>{error}</p>
      </div>
    );
  }

  // Summary
  const summary = modelType === "flat"
    ? `Flat ${basePct || staffDefaultRate}% commission`
    : `Sliding scale, ${bands.length} tier${bands.length !== 1 ? "s" : ""}, ${tieredMode}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Commission model */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Commission model</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{summary}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saveMsg && <span style={{ fontSize: 12, color: saveMsg === "Saved" ? "var(--success)" : "var(--error)" }}>{saveMsg}</span>}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!isDirty || saving || hasErrors}
              style={{ opacity: !isDirty || saving || hasErrors ? 0.5 : 1, fontSize: 13, height: 32, padding: "0 14px" }}
            >
              {saving ? "Saving..." : "Save commission settings"}
            </button>
          </div>
        </div>

        {/* Model selector */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => { setModelType("flat"); setSaveMsg(null); }}
              style={{
                height: 36, padding: "0 16px", borderRadius: "var(--radius-lg)",
                border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: modelType === "flat" ? "var(--brand-soft)" : "transparent",
                color: modelType === "flat" ? "var(--brand)" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: 6, transition: "all 120ms",
              }}
            >
              <Percent size={14} strokeWidth={1.5} /> Flat rate
            </button>
            <button
              type="button"
              onClick={() => { setModelType("tiered"); setSaveMsg(null); }}
              style={{
                height: 36, padding: "0 16px", borderRadius: "var(--radius-lg)",
                border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: modelType === "tiered" ? "var(--brand-soft)" : "transparent",
                color: modelType === "tiered" ? "var(--brand)" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: 6, transition: "all 120ms",
              }}
            >
              <Layers size={14} strokeWidth={1.5} /> Sliding scale
            </button>
          </div>
        </div>

        {/* Flat config */}
        {modelType === "flat" && (
          <div style={{ padding: "16px 24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Commission rate</span>
              <input
                type="text"
                inputMode="decimal"
                value={basePct}
                onChange={(e) => { setBasePct(e.target.value); setSaveMsg(null); }}
                placeholder={String(staffDefaultRate)}
                style={{
                  width: 72, height: 32, borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-strong)", padding: "0 8px",
                  fontSize: 13, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none",
                }}
              />
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>%</span>
            </label>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
              Default: {staffDefaultRate}%. Leave blank to use the default.
            </p>
          </div>
        )}

        {/* Tiered config */}
        {modelType === "tiered" && (
          <div style={{ padding: "16px 24px" }}>
            {/* Mode toggle */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Calculation mode</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => { setTieredMode("whole"); setSaveMsg(null); }}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: "var(--radius-lg)",
                    border: tieredMode === "whole" ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                    background: tieredMode === "whole" ? "var(--brand-soft)" : "var(--bg-card)",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Whole</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Once they cross a tier, their whole period earns the new rate.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setTieredMode("marginal"); setSaveMsg(null); }}
                  style={{
                    flex: 1, padding: "10px 12px", borderRadius: "var(--radius-lg)",
                    border: tieredMode === "marginal" ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                    background: tieredMode === "marginal" ? "var(--brand-soft)" : "var(--bg-card)",
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Marginal</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Only the dollars above each tier earn the higher rate (like tax brackets).
                  </div>
                </button>
              </div>
            </div>

            {/* Bands */}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Tier bands</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bands.map((b, i) => (
                  <div key={b.uid} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)", width: 40, flexShrink: 0 }}>From</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={b.thresholdDollars}
                      onChange={(e) => updateBand(i, "thresholdDollars", e.target.value)}
                      style={{
                        width: 90, height: 32, borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-strong)", padding: "0 8px",
                        fontSize: 13, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>Rate</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={b.ratePct}
                      onChange={(e) => updateBand(i, "ratePct", e.target.value)}
                      style={{
                        width: 60, height: 32, borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-strong)", padding: "0 8px",
                        fontSize: 13, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>%</span>
                    {bands.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBand(i)}
                        className="btn btn-ghost"
                        style={{ height: 28, width: 28, padding: 0, color: "var(--error)" }}
                        aria-label="Remove band"
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBand}
                className="btn btn-ghost"
                style={{ marginTop: 8, fontSize: 12, height: 28, padding: "0 10px", color: "var(--brand)" }}
              >
                <Plus size={12} strokeWidth={1.5} /> Add tier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Per-service overrides */}
      {eligibleServices.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Per-service overrides</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Overrides take priority over the model above for that service.
            </p>
          </div>
          {eligibleServices.map((svc) => {
            const inp = perServiceInputs[svc.serviceId] || { type: "none" as OverrideType, value: "" };
            return (
              <div key={svc.serviceId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", flex: 1, minWidth: 120 }}>{svc.name}</span>
                <select
                  value={inp.type}
                  onChange={(e) => setOverrideType(svc.serviceId, e.target.value as OverrideType)}
                  style={{
                    height: 28, borderRadius: "var(--radius-md)", border: "1px solid var(--border-strong)",
                    padding: "0 8px", fontSize: 12, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none",
                  }}
                >
                  <option value="none">No override</option>
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat ($)</option>
                </select>
                {inp.type !== "none" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {inp.type === "flat" && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>$</span>}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inp.value}
                      onChange={(e) => setOverrideValue(svc.serviceId, e.target.value)}
                      placeholder={inp.type === "percent" ? "e.g. 50" : "e.g. 25.00"}
                      style={{
                        width: 72, height: 28, borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-strong)", padding: "0 8px",
                        fontSize: 12, color: "var(--text-primary)", background: "var(--bg-card)", outline: "none",
                      }}
                    />
                    {inp.type === "percent" && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>%</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Validation errors */}
      {hasErrors && (
        <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--error-soft)", border: "1px solid var(--error)" }}>
          {validationErrors.map((e, i) => (
            <p key={i} style={{ fontSize: 12, color: "var(--error)", margin: "2px 0" }}>{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}
