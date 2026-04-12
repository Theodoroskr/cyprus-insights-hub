import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mocks must be declared inline inside vi.mock factories (hoisted)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(
            Promise.resolve({ data: [
              { id: "w1", company_id: "c1", company_name: "Test Co", company_type: "directory", company_slug: "test-co", notes: null, created_at: "2026-01-01" },
            ] })
          ),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(
            Promise.resolve({ data: { id: "w2", company_id: "c2", company_name: "New Co", company_type: "directory", company_slug: null, notes: null, created_at: "2026-01-02" } })
          ),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(Promise.resolve({})),
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
  it("returns loading=true initially", () => {
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.loading).toBe(true);
  });

  it("fetches items for authenticated user", async () => {
    const { result } = renderHook(() => useWatchlist());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].company_name).toBe("Test Co");
    expect(result.current.loading).toBe(false);
  });

  it("isWatching returns true for watched company", async () => {
    const { result } = renderHook(() => useWatchlist());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.isWatching("c1")).toBe(true);
    expect(result.current.isWatching("c999")).toBe(false);
  });
});
