import { describe, expect, it } from "vitest";
import { stripDiacritics } from "./text";

describe("stripDiacritics", () => {
  it("removes accent marks", () => {
    expect(stripDiacritics("dominádas")).toBe("dominadas");
    expect(stripDiacritics("Pájaros")).toBe("pajaros");
    expect(stripDiacritics("búlgara")).toBe("bulgara");
  });

  it("lowercases the string", () => {
    expect(stripDiacritics("Press Banca")).toBe("press banca");
  });

  it("is idempotent on already-clean strings", () => {
    expect(stripDiacritics("squat")).toBe("squat");
  });
});
