import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./confirm-dialog";

const base = {
  title: "¿Borrar serie?",
  onConfirm: () => {},
  onCancel: () => {},
};

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(<ConfirmDialog {...base} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and description when open", () => {
    render(
      <ConfirmDialog {...base} open description="No se puede deshacer" />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("¿Borrar serie?")).toBeInTheDocument();
    expect(screen.getByText("No se puede deshacer")).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is pressed", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog {...base} open onConfirm={onConfirm} confirmLabel="Borrar" />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when the cancel button is pressed", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} open onCancel={onCancel} cancelLabel="Cancelar" />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape is pressed", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} open onCancel={onCancel} />);
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe("ConfirmDialog focus management", () => {
  it("moves focus to the cancel button when opened", () => {
    render(<ConfirmDialog {...base} open cancelLabel="Cancelar" />);
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
  });

  it("wraps Tab focus from the last element back to the first", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog {...base} open confirmLabel="Borrar" cancelLabel="Cancelar" />,
    );
    const confirm = screen.getByRole("button", { name: "Borrar" });
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    // Cancel is autofocused and is the last focusable element in the dialog.
    expect(cancel).toHaveFocus();
    await user.tab();
    expect(confirm).toHaveFocus();
  });

  it("wraps Shift+Tab focus from the first element back to the last", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmDialog {...base} open confirmLabel="Borrar" cancelLabel="Cancelar" />,
    );
    const confirm = screen.getByRole("button", { name: "Borrar" });
    const cancel = screen.getByRole("button", { name: "Cancelar" });
    confirm.focus();
    await user.tab({ shift: true });
    expect(cancel).toHaveFocus();
  });

  it("restores focus to the previously focused element when closed", () => {
    const { rerender } = render(
      <>
        <button type="button">trigger</button>
        <ConfirmDialog {...base} open={false} />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "trigger" });
    trigger.focus();
    expect(trigger).toHaveFocus();

    rerender(
      <>
        <button type="button">trigger</button>
        <ConfirmDialog {...base} open />
      </>,
    );
    expect(trigger).not.toHaveFocus();

    rerender(
      <>
        <button type="button">trigger</button>
        <ConfirmDialog {...base} open={false} />
      </>,
    );
    expect(trigger).toHaveFocus();
  });
});
