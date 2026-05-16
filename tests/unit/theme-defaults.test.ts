import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { kasseTheme } from "@/lib/theme/defaults/kasse";
import { salonTransactTheme } from "@/lib/theme/defaults/salontransact";
import { salonBackedTheme } from "@/lib/theme/defaults/salonbacked";
import { getProductTheme, mergeThemeConfig, themes } from "@/lib/theme/registry";

describe("Theme defaults + registry (P0.B.1-5)", () => {
  it("(a) kasseTheme uses production Kasse brand palette", () => {
    assert.equal(kasseTheme.id, 'kasse-default');
    assert.equal(kasseTheme.colors.primary, '#2f5061');     // deep teal-navy
    assert.equal(kasseTheme.colors.background, '#faf8f6');  // cream page bg
    assert.equal(kasseTheme.colors.surface, '#ffffff');
    assert.equal(kasseTheme.copy.productName, 'Kasse');
  });

  it("(a2) kasseTheme exposes Kasse brand colors (brand/accent/blush/sidebar)", () => {
    assert.equal(kasseTheme.colors.brand, '#2f5061');
    assert.equal(kasseTheme.colors.accent, '#4297a0');     // bright teal
    assert.equal(kasseTheme.colors.blush, '#e57f84');      // coral
    assert.equal(kasseTheme.colors.sidebar, '#2f5061');
  });

  it("(b) salonTransactTheme is dark with gold accent", () => {
    assert.equal(salonTransactTheme.id, 'salontransact-default');
    assert.equal(salonTransactTheme.colors.primary, '#C9A84C');
    assert.equal(salonTransactTheme.colors.background, '#0a0a0a');
    assert.equal(salonTransactTheme.colors.surface, '#1a1a1a');
  });

  it("(c) salonBackedTheme is dark with teal slate accent + bright hover", () => {
    assert.equal(salonBackedTheme.id, 'salonbacked-default');
    assert.equal(salonBackedTheme.colors.primary, '#606E74');
    assert.equal(salonBackedTheme.colors.primaryHover, '#7a8f96');
    assert.equal(salonBackedTheme.colors.background, '#06080d');
    assert.equal(salonBackedTheme.colors.surface, '#0d1117');
  });

  it("(d) all themes have all 11 required color fields", () => {
    const requiredColors = ['primary', 'primaryHover', 'background', 'surface', 'border', 'text', 'textMuted', 'success', 'warning', 'danger', 'info'];
    for (const theme of [kasseTheme, salonTransactTheme, salonBackedTheme]) {
      for (const key of requiredColors) {
        assert.ok((theme.colors as Record<string, string>)[key], `${theme.id} missing color.${key}`);
      }
    }
  });

  it("(e) getProductTheme returns kasse for unknown product", () => {
    assert.equal(getProductTheme('not-a-real-product').id, 'kasse-default');
  });

  it("(f) getProductTheme returns correct theme for each product", () => {
    assert.equal(getProductTheme('kasse').id, 'kasse-default');
    assert.equal(getProductTheme('salontransact').id, 'salontransact-default');
    assert.equal(getProductTheme('salonbacked').id, 'salonbacked-default');
  });

  it("(g) mergeThemeConfig with null override returns base unchanged", () => {
    const merged = mergeThemeConfig(kasseTheme, null);
    assert.equal(merged, kasseTheme);
  });

  it("(h) mergeThemeConfig with primary color override deep-merges colors", () => {
    const merged = mergeThemeConfig(kasseTheme, { colors: { primary: '#ff0000' } });
    assert.equal(merged.colors.primary, '#ff0000');
    assert.equal(merged.colors.background, '#faf8f6'); // unchanged
    assert.equal(merged.colors.surface, '#ffffff');    // unchanged
  });

  it("(i) mergeThemeConfig deep-merges multiple nested fields without dropping unspecified ones", () => {
    const merged = mergeThemeConfig(kasseTheme, {
      colors: { primary: '#ff0000' },
      copy: { productName: 'MerchantBrand' },
    });
    assert.equal(merged.colors.primary, '#ff0000');
    assert.equal(merged.copy.productName, 'MerchantBrand');
    assert.equal(merged.copy.poweredBy, 'Powered by Reyna Pay'); // unchanged
    assert.equal(merged.emailTemplates.senderName, 'Kasse');     // unchanged
  });

  it("(j) themes registry has exactly 3 entries", () => {
    assert.equal(Object.keys(themes).length, 3);
  });
});
