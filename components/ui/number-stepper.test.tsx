import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NumberStepper } from "./number-stepper";

describe("NumberStepper", () => {
  it("shows a focus ring on the container via focus-within", () => {
    const { container } = render(<NumberStepper value={10} onChange={() => {}} />);
    // the bordered container is the div that holds the - input + buttons
    const box = container.querySelector(".rounded-control");
    expect(box?.className).toContain("focus-within:ring");
  });

  it("increments the value with the + button", async () => {
    const onChange = vi.fn();
    render(<NumberStepper value={10} onChange={onChange} step={5} />);
    await userEvent.click(screen.getByRole("button", { name: "Sumar 5" }));
    expect(onChange).toHaveBeenCalledWith(15);
  });
});
