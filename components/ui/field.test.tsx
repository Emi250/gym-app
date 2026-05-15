import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field, Input, Select } from "./field";

describe("Field", () => {
  it("renders the label and child control", () => {
    render(
      <Field label="Nombre" htmlFor="name">
        <Input id="name" />
      </Field>,
    );
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("renders the optional hint", () => {
    render(
      <Field label="Fecha" hint="Cuándo empezás">
        <Input />
      </Field>,
    );
    expect(screen.getByText("Cuándo empezás")).toBeInTheDocument();
  });
});

describe("Input", () => {
  it("uses a focus-visible ring (not focus:)", () => {
    render(<Input aria-label="x" />);
    expect(screen.getByLabelText("x").className).toContain("focus-visible:ring");
  });
});

describe("Select", () => {
  it("renders its options and a chevron indicator", () => {
    const { container } = render(
      <Select aria-label="Ejercicio">
        <option value="a">A</option>
      </Select>,
    );
    expect(screen.getByLabelText("Ejercicio")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "A" })).toBeInTheDocument();
    // chevron svg is rendered as a sibling
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
