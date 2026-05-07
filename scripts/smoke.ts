#!/usr/bin/env tsx
/**
 * Kasse smoke harness.
 *
 * Walks the app/ directory, discovers every page.tsx and route.ts, and pings
 * each one against a running server. Reports pass/fail per route.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://localhost:3000 npx tsx scripts/smoke.ts
 *   SMOKE_BASE_URL=https://portal.kasseapp.com npx tsx scripts/smoke.ts
 *
 * Optional auth (for authenticated route testing — not required for baseline):
 *   SMOKE_SESSION_COOKIE="next-auth.session-token=..." npx tsx scripts/smoke.ts
 *
 * Exit code: 0 if all routes returned an acceptable status, 1 otherwise.
 */

import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const SESSION_COOKIE = process.env.SMOKE_SESSION_COOKIE ?? "";
const APP_DIR = "app";

interface Route {
  kind: "page" | "api";
  filepath: string;
  url: string;
  // Routes with dynamic segments [id] are skipped — we cannot synthesize a valid id.
  isDynamic: boolean;
}

interface Result {
  route: Route;
  status: number | "ERROR";
  ok: boolean;
  reason: string;
  ms: number;
}

function discoverRoutes(dir: string, base: string = ""): Route[] {
  const out: Route[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }

  for (const entry of entries) {
    // Skip Next.js conventions that aren't navigable
    if (entry.startsWith("_") || entry === "favicon.ico" || entry === "globals.css") continue;
    if (entry === "layout.tsx" || entry === "error.tsx" || entry === "loading.tsx" || entry === "not-found.tsx") continue;
    if (entry === "generated") continue;

    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }

    if (st.isDirectory()) {
      // Route groups (parens) don't add to the URL
      const groupSegment = entry.startsWith("(") && entry.endsWith(")") ? "" : entry;
      const nextBase = groupSegment ? `${base}/${groupSegment}` : base;
      out.push(...discoverRoutes(full, nextBase));
      continue;
    }

    if (entry === "page.tsx" || entry === "page.ts") {
      const url = base === "" ? "/" : base;
      out.push({
        kind: "page",
        filepath: relative(process.cwd(), full).split(sep).join("/"),
        url,
        isDynamic: url.includes("["),
      });
    } else if (entry === "route.tsx" || entry === "route.ts") {
      const url = base === "" ? "/" : base;
      out.push({
        kind: "api",
        filepath: relative(process.cwd(), full).split(sep).join("/"),
        url,
        isDynamic: url.includes("["),
      });
    }
  }
  return out;
}

async function check(route: Route): Promise<Result> {
  const start = Date.now();
  const url = `${BASE_URL}${route.url}`;
  const headers: Record<string, string> = {
    "user-agent": "kasse-smoke/0.1",
  };
  if (SESSION_COOKIE) headers.cookie = SESSION_COOKIE;

  try {
    // Use AbortController for a 10s timeout per request.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 10_000);
    const res = await fetch(url, {
      method: "GET",
      headers,
      redirect: "manual", // we want to see 3xx, not follow them
      signal: ac.signal,
    });
    clearTimeout(timer);
    const ms = Date.now() - start;

    return classify(route, res.status, ms);
  } catch (e: any) {
    return {
      route,
      status: "ERROR",
      ok: false,
      reason: `fetch failed: ${e.message ?? String(e)}`,
      ms: Date.now() - start,
    };
  }
}

function classify(route: Route, status: number, ms: number): Result {
  // Acceptable outcomes by route kind:
  //   Pages: 200 (rendered), 3xx (auth redirect), 401/403 (gated).
  //   API:   200/204 (works without auth — rare), 401/403 (gated), 405 (GET not allowed but route exists).
  // Failures: 5xx (server crash), 404 (route discovery mismatch), anything else.

  if (route.kind === "page") {
    if (status >= 200 && status < 400) return { route, status, ok: true, reason: "page-ok", ms };
    if (status === 401 || status === 403) return { route, status, ok: true, reason: "page-gated", ms };
    if (status === 404) return { route, status, ok: false, reason: "page-not-found", ms };
    if (status >= 500) return { route, status, ok: false, reason: "page-5xx", ms };
    return { route, status, ok: false, reason: `page-unexpected-${status}`, ms };
  }

  // api
  if (status >= 200 && status < 300) return { route, status, ok: true, reason: "api-ok", ms };
  if (status === 401 || status === 403) return { route, status, ok: true, reason: "api-gated", ms };
  if (status === 405) return { route, status, ok: true, reason: "api-method-ok", ms };
  if (status === 400) return { route, status, ok: true, reason: "api-bad-request-ok", ms };
  if (status === 404) return { route, status, ok: false, reason: "api-not-found", ms };
  if (status >= 500) return { route, status, ok: false, reason: "api-5xx", ms };
  return { route, status, ok: false, reason: `api-unexpected-${status}`, ms };
}

function fmt(s: string, w: number): string {
  if (s.length >= w) return s.slice(0, w);
  return s + " ".repeat(w - s.length);
}

async function main() {
  console.log(`\nKasse smoke harness`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth cookie: ${SESSION_COOKIE ? "yes" : "no (testing unauth gates)"}`);

  const routes = discoverRoutes(APP_DIR);
  const testable = routes.filter((r) => !r.isDynamic);
  const skipped = routes.length - testable.length;

  console.log(`Discovered ${routes.length} routes, testing ${testable.length}, skipping ${skipped} dynamic.\n`);

  const results: Result[] = [];
  // Run sequentially to keep the dev server happy and to make output deterministic.
  for (const r of testable) {
    const result = await check(r);
    results.push(result);
    const mark = result.ok ? "PASS" : "FAIL";
    console.log(
      `  ${fmt(mark, 4)}  ${fmt(String(result.status), 7)}  ${fmt(result.ms + "ms", 7)}  ${fmt(r.kind, 5)}  ${r.url}`,
    );
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\nSummary: ${passed}/${results.length} ok, ${failed.length} failed, ${skipped} skipped (dynamic).`);

  if (failed.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failed) {
      console.log(`  ${f.route.kind.padEnd(5)} ${f.route.url}`);
      console.log(`    status: ${f.status}  reason: ${f.reason}`);
      console.log(`    file:   ${f.route.filepath}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error("smoke harness crashed:", e);
  process.exit(2);
});
