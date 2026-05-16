import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildThemeCssVars, buildThemeStyleContent } from "@/lib/theme/css-vars";
import { kasseTheme } from "@/lib/theme/defaults/kasse";
import { salonTransactTheme } from "@/lib/theme/defaults/salontransact";
import { salonBackedTheme } from "@/lib/theme/defaults/salonbacked";

describe("buildThemeCssVars (P0.B.6-7)", () => {
  it("(a) emits --color-primary with kasse value", () => {
    const css = buildThemeCssVars(kasseTheme);
    assert.ok(css.includes("--color-primary: #606E74;"), `expected --color-primary: #606E74 in:\n${css}`);
  });

  it("(b) camelCase keys become kebab-case CSS vars", () => {
    const css = buildThemeCssVars(kasseTheme);
    assert.ok(css.includes("--color-primary-hover:"), "primaryHover should become --color-primary-hover");
    assert.ok(css.includes("--color-text-muted:"), "textMuted should become --color-text-muted");
  });

  it("(c) emits all 11 color vars for any theme", () => {
    const css = buildThemeCssVars(salonTransactTheme);
    const requiredVars = [
      "--color-primary:",
      "--color-primary-hover:",
      "--color-background:",
      "--color-surface:",
      "--color-border:",
      "--color-text:",
      "--color-text-muted:",
      "--color-success:",
      "--color-warning:",
      "--color-danger:",
      "--color-info:",
    ];
    for (const v of requiredVars) {
      assert.ok(css.includes(v), `expected ${v} in CSS output`);
    }
  });

  it("(d) emits --font-sans and --font-mono", () => {
    const css = buildThemeCssVars(kasseTheme);
    assert.ok(css.includes("--font-sans:"), "expected --font-sans");
    assert.ok(css.includes("--font-mono:"), "expected --font-mono");
  });

  it("(e) salontransact theme emits gold primary color value", () => {
    const css = buildThemeCssVars(salonTransactTheme);
    assert.ok(css.includes("#C9A84C"), `expected gold #C9A84C in:\n${css}`);
  });

  it("(f) salonbacked theme emits dark background color", () => {
    const css = buildThemeCssVars(salonBackedTheme);
    assert.ok(css.includes("--color-background: #06080d;"), "expected SalonBacked bg #06080d");
  });

  it("(g) buildThemeStyleContent wraps output in :root { } block", () => {
    const content = buildThemeStyleContent(kasseTheme);
    assert.ok(content.startsWith(":root {"), "must start with :root {");
    assert.ok(content.endsWith("}"), "must end with }");
    assert.ok(content.includes("--color-primary:"), "must include color vars");
  });

  it("(h) buildThemeStyleContent output is valid-looking CSS (no obvious syntax issues)", () => {
    const content = buildThemeStyleContent(kasseTheme);
    const openBraces = (content.match(/\{/g) ?? []).length;
    const closeBraces = (content.match(/\}/g) ?? []).length;
    assert.equal(openBraces, closeBraces, "braces should balance");
    // Every declaration line should end with semicolon
    const declLines = content.split("\n").filter(l => l.trim().startsWith("--"));
    for (const line of declLines) {
      assert.ok(line.trim().endsWith(";"), `declaration line should end with semicolon: ${line}`);
    }
  });
});
