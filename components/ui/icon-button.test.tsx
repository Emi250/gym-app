import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("exposes its accessible label", () => {
    render(<IconButton aria-label="Volver"><span /></IconButton>);
    expect(screen.getByRole("button", { name: "Volver" })).toBeInTheDocument();
  });

  it("has a visible focus ring class", () => {
    render(<IconButton aria-label="Volver"><span /></IconButton>);
    expect(screen.getByRole("button").className).toContain("focus-visible:ring");
  });

  it("applies the small size variant", () => {
    render(<IconButton aria-label="x" size="sm"><span /></IconButton>);
    expect(screen.getByRole("button").className).toContain("h-9");
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<IconButton aria-label="x" onClick={onClick}><span /></IconButton>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
