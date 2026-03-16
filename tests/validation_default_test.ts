import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("validation enabled by default", () => {
  it("validation enabled by default", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-validation-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
