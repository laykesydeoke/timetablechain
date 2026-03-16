import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("pricing enabled by default", () => {
  it("pricing enabled by default", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-pricing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
