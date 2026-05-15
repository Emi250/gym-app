import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDebouncedCallback } from "./use-debounced-callback";

describe("useDebouncedCallback", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("invokes the callback once, with the latest args, after the delay", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 300));
    result.current("a");
    result.current("b");
    result.current("c");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("restarts the timer on each call", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 300));
    result.current("x");
    vi.advanceTimersByTime(200);
    result.current("y");
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledExactlyOnceWith("y");
  });
});
