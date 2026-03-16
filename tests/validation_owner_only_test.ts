import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("only owner can set validation", () => {
  it("only owner can set validation", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-validation-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
