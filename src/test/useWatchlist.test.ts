import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(Promise.resolve({ data: [{ id: "w1", company_id: "c1", company_name: "Test Co", company_slug: "test-co", company_type: "directory", user_id: "user-1", created_at: new Date().toISOString(), notes: null }] })),
        }),
      }),
      insert: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
      delete: vi.fn().mockReturnValue({
        match: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
      }),
    })),
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" }, session: null, loading: false, profile: null, signUp: vi.fn(), signIn: vi.fn(), signOut: vi.fn() }),
}));

import { useWatchlist } from "@/hooks/useWatchlist";

describe("useWatchlist", () => {
  it("starts with loading=true and empty items", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it("loads items and resolves loading to false", async () => {
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].company_name).toBe("Test Co");
  });

  it("isWatching returns true for watched company after load", async () => {
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isWatching("c1")).toBe(true);
    expect(result.current.isWatching("unknown-id")).toBe(false);
  });

  it("exposes toggleWatch and refetch functions", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(typeof result.current.toggleWatch).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});
