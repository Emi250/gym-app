import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>contenido</Card>);
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });

  it("applies the default medium padding", () => {
    const { container } = render(<Card>x</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("p-4");
  });

  it("applies a chosen padding variant", () => {
    const { container } = render(<Card padding="lg">x</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("p-5");
  });

  it("merges a custom className", () => {
    const { container } = render(<Card className="mt-2">x</Card>);
    expect((container.firstElementChild as HTMLElement).className).toContain("mt-2");
  });
});
