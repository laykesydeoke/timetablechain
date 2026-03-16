import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("multiple slot prices", () => {
  it("multiple slot prices", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-pricing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
