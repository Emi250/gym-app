"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount. Only runs in production builds —
 * during `next dev` the SW would cache stale chunks and break HMR.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  }, []);
  return null;
}
