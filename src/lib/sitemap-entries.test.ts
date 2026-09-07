import { describe, expect, it } from "vitest";
import { sitemapFingerprint, type PublicSitemapEntry } from "./sitemap-entries";

describe("public sitemap fingerprint", () => {
  const entry = (url: string, lastModified?: Date): PublicSitemapEntry => ({ url, lastModified, changeFrequency: "monthly", priority: 0.5 });

  it("is stable regardless of source ordering", () => {
    const first = [entry("https://grimmfirepump.cl/es/a"), entry("https://grimmfirepump.cl/es/b", new Date("2026-09-01T00:00:00.000Z"))];
    expect(sitemapFingerprint(first)).toBe(sitemapFingerprint([...first].reverse()));
  });

  it("changes only when a URL or its truthful modification time changes", () => {
    const baseline = [entry("https://grimmfirepump.cl/es/a")];
    expect(sitemapFingerprint(baseline)).not.toBe(sitemapFingerprint([entry("https://grimmfirepump.cl/es/a", new Date("2026-09-01T00:00:00.000Z"))]));
    expect(sitemapFingerprint(baseline)).not.toBe(sitemapFingerprint([entry("https://grimmfirepump.cl/es/b")]));
  });
});
