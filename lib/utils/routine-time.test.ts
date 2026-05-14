import { describe, expect, it } from "vitest";
import { routineDurationLabel } from "./routine-time";

const at = (iso: string) => new Date(iso);

describe("routineDurationLabel", () => {
  it("returns null when started_at is null", () => {
    expect(routineDurationLabel(null)).toBeNull();
  });

  it("returns null for invalid dates", () => {
    expect(routineDurationLabel("not-a-date")).toBeNull();
  });

  it("returns null when start is in the future", () => {
    expect(routineDurationLabel("2026-12-31T00:00:00Z", at("2026-05-14T00:00:00Z"))).toBeNull();
  });

  it("says 'Empezó hoy' on day 0", () => {
    expect(
      routineDurationLabel("2026-05-14T08:00:00Z", at("2026-05-14T20:00:00Z")),
    ).toBe("Empezó hoy");
  });

  it("returns days for the first 13 days", () => {
    expect(
      routineDurationLabel("2026-05-14T00:00:00Z", at("2026-05-15T00:00:00Z")),
    ).toBe("1 día");
    expect(
      routineDurationLabel("2026-05-01T00:00:00Z", at("2026-05-14T00:00:00Z")),
    ).toBe("13 días");
  });

  it("returns weeks between 2 and 11 weeks", () => {
    expect(
      routineDurationLabel("2026-05-01T00:00:00Z", at("2026-05-15T00:00:00Z")),
    ).toBe("2 semanas");
    expect(
      routineDurationLabel("2026-03-01T00:00:00Z", at("2026-05-14T00:00:00Z")),
    ).toBe("10 semanas");
  });

  it("returns months for 12+ weeks", () => {
    // Use mid-day dates to keep the comparison timezone-stable.
    expect(
      routineDurationLabel("2026-01-15T12:00:00", at("2026-05-15T12:00:00")),
    ).toBe("4 meses");
  });
});
