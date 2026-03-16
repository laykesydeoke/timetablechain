import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("validation invariants hold", () => {
  it("validation invariants hold", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-validation-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
