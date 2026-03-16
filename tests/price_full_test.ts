import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("full pricing lifecycle", () => {
  it("full pricing lifecycle", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-pricing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
