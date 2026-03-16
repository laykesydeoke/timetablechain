import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("batch 12", () => {
  it("test 12", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-batch-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
