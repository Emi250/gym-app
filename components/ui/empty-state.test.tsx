import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dumbbell } from "lucide-react";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the title", () => {
    render(<EmptyState icon={Dumbbell} title="Sin sesiones" />);
    expect(screen.getByText("Sin sesiones")).toBeInTheDocument();
  });

  it("renders the optional description", () => {
    render(
      <EmptyState icon={Dumbbell} title="Sin sesiones" description="Aparecerá acá" />,
    );
    expect(screen.getByText("Aparecerá acá")).toBeInTheDocument();
  });

  it("renders the optional action", () => {
    render(
      <EmptyState
        icon={Dumbbell}
        title="Sin sesiones"
        action={<button type="button">Crear</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });
});
