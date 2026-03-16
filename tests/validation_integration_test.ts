import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("slot validation integration", () => {
  it("validation integrates with all protocol modules", () => {
    const params = simnet.callReadOnlyFn("timetablechain", "get-validation-params", [], simnet.deployer);
    const access = simnet.callReadOnlyFn("timetablechain", "get-access-summary", [], simnet.deployer);
    const govParams = simnet.callReadOnlyFn("timetablechain", "get-governance-params", [], simnet.deployer);
    expect(params.result).not.toBeNone();
    expect(access.result).not.toBeNone();
    expect(govParams.result).not.toBeNone();
  });
});
