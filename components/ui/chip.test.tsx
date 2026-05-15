import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip } from "./chip";

describe("Chip", () => {
  it("renders its label", () => {
    render(<Chip>Pecho</Chip>);
    expect(screen.getByRole("button", { name: "Pecho" })).toBeInTheDocument();
  });

  it("reflects the active state via aria-pressed", () => {
    render(<Chip active>Pecho</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("defaults to not-pressed", () => {
    render(<Chip>Pecho</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("applies the accent style when active", () => {
    render(<Chip active>Pecho</Chip>);
    expect(screen.getByRole("button").className).toContain("bg-accent");
  });

  it("calls onClick when pressed", async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Pecho</Chip>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
