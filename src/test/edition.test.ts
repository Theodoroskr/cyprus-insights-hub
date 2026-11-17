import { describe, it, expect } from "vitest";
import { editionFromLocation, greeceCanonical } from "@/lib/edition";

describe("edition", () => {
  it("businesshub.gr host is the Greece edition", () => expect(editionFromLocation("businesshub.gr", "/")).toBe("gr"));
  it("/greece path on .cy is the Greece edition", () => expect(editionFromLocation("businesshub.cy", "/greece/banking")).toBe("gr"));
  it("Cyprus pages stay Cyprus", () => expect(editionFromLocation("businesshub.cy", "/greeceland")).toBe("cy"));
  it("no .gr canonical before the domain is live", () => expect(greeceCanonical("/greece", "x")).toBeNull());
});
