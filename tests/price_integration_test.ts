import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("slot pricing integration", () => {
  it("pricing integrates with timetablechain", () => {
    const params = simnet.callReadOnlyFn("timetablechain", "get-pricing-params", [], simnet.deployer);
    const analytics = simnet.callReadOnlyFn("timetablechain", "get-slot-analytics", [], simnet.deployer);
    expect(params.result).not.toBeNone();
    expect(analytics.result).not.toBeNone();
  });
});
