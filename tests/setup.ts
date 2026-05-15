import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// globals: false disables RTL's automatic cleanup, so register it explicitly.
afterEach(() => {
  cleanup();
});
