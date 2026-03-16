import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("batch 5", () => {
  it("test 5", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-batch-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
