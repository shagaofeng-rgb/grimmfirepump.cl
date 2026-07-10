import { describe, expect, it } from "vitest";
import { products } from "./products";

describe("product catalog", () => {
  it("keeps unique stable slugs for public routes", () => {
    expect(new Set(products.map((product) => product.slug)).size).toBe(products.length);
  });
  it("has structured technical values for every listed product", () => {
    expect(products.every((product) => product.specs.length >= 3 && product.specs.every(([key, value]) => key.length > 0 && value.length > 0))).toBe(true);
  });
});
