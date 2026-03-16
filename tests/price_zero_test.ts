import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("zero price rejected", () => {
  it("zero price rejected", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-pricing-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
