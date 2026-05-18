import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectLocale, parseAcceptLanguage } from "@/lib/i18n/detect";

describe("detectLocale (P0.H.3)", () => {
  it("prefers User.locale when set and supported", () => {
    assert.equal(
      detectLocale({
        userLocale: "es-MX",
        organizationDefaultLocale: "en-US",
        acceptLanguageHeader: "fr",
      }),
      "es-MX",
    );
  });

  it("falls back to Organization.defaultLocale when User.locale unset", () => {
    assert.equal(
      detectLocale({
        userLocale: null,
        organizationDefaultLocale: "es-US",
        acceptLanguageHeader: "en",
      }),
      "es-US",
    );
  });

  it("falls back to Accept-Language when User and Org locales unset", () => {
    assert.equal(
      detectLocale({
        userLocale: null,
        organizationDefaultLocale: null,
        acceptLanguageHeader: "es-MX,es;q=0.9",
      }),
      "es-MX",
    );
  });

  it("returns en-US default when nothing detected", () => {
    assert.equal(
      detectLocale({
        userLocale: null,
        organizationDefaultLocale: null,
        acceptLanguageHeader: null,
      }),
      "en-US",
    );
  });

  it("ignores unsupported locale in User.locale and falls through", () => {
    assert.equal(
      detectLocale({
        userLocale: "fr-FR",
        organizationDefaultLocale: "es-MX",
        acceptLanguageHeader: "en",
      }),
      "es-MX",
    );
  });

  it("ignores unsupported Organization.defaultLocale and falls through", () => {
    assert.equal(
      detectLocale({
        userLocale: null,
        organizationDefaultLocale: "zh-CN",
        acceptLanguageHeader: "es",
      }),
      "es-MX",
    );
  });
});

describe("parseAcceptLanguage (P0.H.3)", () => {
  it("returns null for null/empty header", () => {
    assert.equal(parseAcceptLanguage(null), null);
    assert.equal(parseAcceptLanguage(""), null);
  });

  it("matches exact locale tags", () => {
    assert.equal(parseAcceptLanguage("es-MX"), "es-MX");
    assert.equal(parseAcceptLanguage("es-US"), "es-US");
    assert.equal(parseAcceptLanguage("en-US"), "en-US");
  });

  it("respects q-values in priority", () => {
    assert.equal(parseAcceptLanguage("fr;q=0.9,es-MX;q=0.8"), "es-MX");
    assert.equal(parseAcceptLanguage("es-MX;q=0.5,en-US;q=0.9"), "en-US");
  });

  it("falls back to es-MX for generic es", () => {
    assert.equal(parseAcceptLanguage("es"), "es-MX");
    assert.equal(parseAcceptLanguage("es;q=1.0,fr;q=0.5"), "es-MX");
  });

  it("falls back to en-US for generic en", () => {
    assert.equal(parseAcceptLanguage("en"), "en-US");
    assert.equal(parseAcceptLanguage("en;q=1.0"), "en-US");
  });

  it("returns null when no supported language present", () => {
    assert.equal(parseAcceptLanguage("fr,de;q=0.9"), null);
  });

  it("is case-insensitive", () => {
    assert.equal(parseAcceptLanguage("ES-MX"), "es-MX");
    assert.equal(parseAcceptLanguage("En-Us"), "en-US");
  });
});
