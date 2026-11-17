import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { RouteSEODefaults } from "@/components/RouteSEODefaults";

describe("RouteSEODefaults", () => {
  it("renders nothing instead of crashing when the router is missing", () => {
    expect(() =>
      render(
        <HelmetProvider>
          <RouteSEODefaults />
        </HelmetProvider>,
      ),
    ).not.toThrow();
  });

  it("still works inside a router", () => {
    expect(() =>
      render(
        <HelmetProvider>
          <MemoryRouter initialEntries={["/greece"]}>
            <RouteSEODefaults />
          </MemoryRouter>
        </HelmetProvider>,
      ),
    ).not.toThrow();
  });
});
