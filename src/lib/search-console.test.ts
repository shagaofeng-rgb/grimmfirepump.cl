import { describe, expect, it } from "vitest";
import { sitemapSubmissionDecision } from "./search-console";

describe("Search Console sitemap delivery guard", () => {
  const now = new Date("2026-09-07T00:00:00.000Z");

  it("submits the first fingerprint", () => {
    expect(sitemapSubmissionDecision({ force: false, now, lastSucceededAt: null, previousFingerprint: null, fingerprint: "next" })).toEqual({ submit: true });
  });

  it("does not resubmit an unchanged sitemap from the scheduler", () => {
    expect(sitemapSubmissionDecision({ force: false, now, lastSucceededAt: new Date("2026-09-03T00:00:00.000Z"), previousFingerprint: "same", fingerprint: "same" })).toEqual({ submit: false, reason: "sitemap_unchanged" });
  });

  it("enforces the 72-hour guard for a changed sitemap", () => {
    expect(sitemapSubmissionDecision({ force: false, now, lastSucceededAt: new Date("2026-09-05T12:00:00.000Z"), previousFingerprint: "old", fingerprint: "next" })).toEqual({ submit: false, reason: "cadence_guard" });
  });

  it("allows an authorised manual verification run", () => {
    expect(sitemapSubmissionDecision({ force: true, now, lastSucceededAt: new Date("2026-09-06T23:00:00.000Z"), previousFingerprint: "same", fingerprint: "same" })).toEqual({ submit: true });
  });
});
