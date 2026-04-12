import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(Promise.resolve({ data: [] })),
        }),
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

  it("isWatching returns false for unwatched company", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.isWatching("unknown-id")).toBe(false);
  });

  it("exposes toggleWatch and refetch functions", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(typeof result.current.toggleWatch).toBe("function");
    expect(typeof result.current.refetch).toBe("function");
  });
});
