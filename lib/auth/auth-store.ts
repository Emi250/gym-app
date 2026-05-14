"use client";

import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/sync/supabase";

/**
 * External store for the current Supabase session. Wrapped with
 * `useSyncExternalStore` so React 19's "no setState-in-effect" lint
 * doesn't fight us. The store lazily initializes itself the first time
 * anything subscribes — it asks Supabase for the current session and
 * subscribes to `onAuthStateChange` for the lifetime of the page.
 */

export interface AuthState {
  user: User | null;
  /** True until the initial getSession() resolves. */
  loading: boolean;
}

const SERVER_SNAPSHOT: AuthState = { user: null, loading: true };

class AuthStore {
  private state: AuthState = SERVER_SNAPSHOT;
  private listeners = new Set<() => void>();
  private initialized = false;

  getSnapshot = (): AuthState => this.state;
  getServerSnapshot = (): AuthState => SERVER_SNAPSHOT;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    void this.ensureInit();
    return () => {
      this.listeners.delete(listener);
    };
  };

  private async ensureInit() {
    if (this.initialized) return;
    this.initialized = true;
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    this.setState({ user: data.session?.user ?? null, loading: false });
    supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      this.setState({ user: session?.user ?? null, loading: false });
    });
  }

  private setState(next: AuthState) {
    if (this.state.user?.id === next.user?.id && this.state.loading === next.loading) {
      return;
    }
    this.state = next;
    for (const l of this.listeners) l();
  }
}

export const authStore = new AuthStore();
