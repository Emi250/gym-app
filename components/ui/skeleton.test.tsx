import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders an aria-hidden pulsing block", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-hidden");
    expect(el.className).toContain("animate-pulse");
  });

  it("merges a custom className for sizing", () => {
    const { container } = render(<Skeleton className="h-32" />);
    expect((container.firstElementChild as HTMLElement).className).toContain("h-32");
  });
});
