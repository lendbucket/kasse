"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, UserPlus } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface CustomerPickerProps {
  locationId: string;
  value: { id: string; name: string } | null;
  onChange: (client: { id: string; name: string } | null) => void;
}

export function CustomerPicker({ locationId, value, onChange }: CustomerPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creating, setCreating] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  const doSearch = useCallback(
    (q: string) => {
      abortRef.current?.abort();
      if (!q.trim()) {
        setResults([]);
        setShowDropdown(false);
        setSearchError(false);
        return;
      }

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSearching(true);
      setSearchError(false);

      const params = new URLSearchParams({ q: q.trim() });
      if (locationId) params.set("locationId", locationId);

      fetch(`/api/clients?${params}`, { signal: ctrl.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error();
          const data = await res.json();
          setResults(
            (data.clients ?? []).map((c: ClientOption) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              email: c.email,
            })),
          );
          setShowDropdown(true);
        })
        .catch((e) => {
          if (e.name !== "AbortError") {
            setResults([]);
            setSearchError(true);
            setShowDropdown(true);
          }
        })
        .finally(() => setSearching(false));
    },
    [locationId],
  );

  useEffect(() => {
    if (value) return; // selected — don't search
    const timer = setTimeout(() => doSearch(query), 200);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, doSearch, value]);

  // Quick-create client
  async function quickCreate() {
    if (creating || !query.trim()) return;
    if (!locationId?.trim()) { setSearchError(true); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query.trim(), locationId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onChange({ id: data.client.id, name: data.client.name });
      setShowDropdown(false);
      setQuery("");
    } catch {
      setSearchError(true);
    } finally {
      setCreating(false);
    }
  }

  // If a client is selected, show a chip
  if (value) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 36,
          borderRadius: 6,
          border: "1px solid var(--brand)",
          background: "var(--bg-card)",
          padding: "0 8px 0 12px",
          fontSize: 14,
          color: "var(--text-primary)",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
          {value.name}
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
            setResults([]);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          aria-label="Clear client"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: 2,
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <Search
          size={16}
          strokeWidth={1.5}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim() && (results.length > 0 || searchError)) setShowDropdown(true); }}
          placeholder="Client (optional)"
          style={{
            width: "100%",
            height: 36,
            borderRadius: 6,
            border: "1px solid var(--border)",
            padding: "0 12px 0 32px",
            fontSize: 16,
            color: "var(--text-primary)",
            background: "var(--bg-card)",
            outline: "none",
          }}
        />
      </div>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 50,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {searchError && (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--error, #dc2626)" }}>
              Search failed
            </div>
          )}

          {!searchError && searching && (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-muted)" }}>
              Searching...
            </div>
          )}

          {!searchError && !searching && results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange({ id: c.id, name: c.name });
                setShowDropdown(false);
                setQuery("");
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                border: "none",
                borderBottom: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 14,
                color: "var(--text-primary)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover, #f9fafb)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ fontWeight: 500 }}>{c.name}</div>
              {c.phone && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{c.phone}</div>
              )}
            </button>
          ))}

          {/* Quick-create row — hidden when an exact-name match already exists */}
          {!searchError && !searching && query.trim() &&
            !results.some((c) => c.name.trim().toLowerCase() === query.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={quickCreate}
              disabled={creating || !locationId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: creating || !locationId ? "not-allowed" : "pointer",
                textAlign: "left",
                fontSize: 14,
                color: "var(--brand)",
                fontWeight: 500,
                opacity: creating || !locationId ? 0.6 : 1,
              }}
              onMouseEnter={(e) => { if (!creating) (e.currentTarget as HTMLElement).style.background = "var(--bg-hover, #f9fafb)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <UserPlus size={16} strokeWidth={1.5} />
              {creating ? "Adding..." : `Add "${query.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
