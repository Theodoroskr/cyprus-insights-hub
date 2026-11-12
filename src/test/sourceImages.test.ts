import { describe, expect, it } from "vitest";
import { sourceImageFor } from "../../supabase/functions/_shared/sourceImages";

describe("sourceImageFor", () => {
  it("gives ICPAC stories the approved logo picture", () => {
    expect(sourceImageFor("icpac")).toContain("icpac-logo-wide.jpg");
    expect(sourceImageFor("icpac:cc342026updateofthefatflist")).toContain("icpac-logo-wide.jpg");
  });
  it("leaves other sources alone", () => {
    expect(sourceImageFor("cbc-announcements")).toBeNull();
    expect(sourceImageFor(null)).toBeNull();
  });
});
