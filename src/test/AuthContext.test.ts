import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

const mockGetSession = vi.fn(() =>
  Promise.resolve({ data: { session: null } })
);

const mockSignUp = vi.fn(() => Promise.resolve({ error: null }));
const mockSignInWithPassword = vi.fn(() => Promise.resolve({ error: null }));
const mockSignOut = vi.fn(() => Promise.resolve({}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...(args as [])),
      getSession: () => mockGetSession(),
      signUp: (...args: unknown[]) => mockSignUp(...(args as [])),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...(args as [])),
      signOut: () => mockSignOut(),
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "u1" } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue(
            Promise.resolve({ data: { display_name: "Test", company: "ACME", tier: "free" } })
          ),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(Promise.resolve({})),
      }),
    })),
  },
}));

import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import React from "react";

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children);
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockReturnValue(
      Promise.resolve({ data: { session: null } })
    );
  });

  it("provides loading=true then false after getSession", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    // Initially loading
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.loading).toBe(false);
  });

  it("user is null when no session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("signIn calls signInWithPassword", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    await act(async () => {
      await result.current.signIn("test@test.com", "password");
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password",
    });
  });

  it("signUp calls supabase signUp with metadata", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    await act(async () => {
      await result.current.signUp("test@test.com", "pass123", {
        full_name: "John",
        company: "ACME",
      });
    });
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@test.com",
        password: "pass123",
        options: expect.objectContaining({
          data: { full_name: "John", company: "ACME" },
        }),
      })
    );
  });

  it("throws when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });
});
