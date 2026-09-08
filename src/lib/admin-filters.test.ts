import { describe, expect, it } from "vitest";
import { dateSql, parseDateFilter } from "@/lib/admin-filters";

describe("admin date filters", () => {
  const now = new Date("2026-09-08T12:00:00.000Z");
  it("uses Chile calendar dates for today", () => {
    const filter = parseDateFilter(new URLSearchParams("preset=today"), now);
    expect(filter.preset).toBe("today");
    expect(filter.from).toMatch(/^2026-09-0[78]$/);
    expect(dateSql(filter, "created_at").args).toHaveLength(2);
  });
  it("rejects malformed custom ranges", () => {
    expect(parseDateFilter(new URLSearchParams("preset=custom&from=bad&to=2026-09-08"), now).preset).toBe("all");
  });
  it("accepts an inclusive custom end date", () => {
    const filter = parseDateFilter(new URLSearchParams("preset=custom&from=2026-09-01&to=2026-09-07"), now);
    expect(filter.from).toBe("2026-09-01");
    expect(filter.to).toBe("2026-09-08");
  });
});
