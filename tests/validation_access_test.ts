import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("access control for validation", () => {
  it("access control for validation", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-validation-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
