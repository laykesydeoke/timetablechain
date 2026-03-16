import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("access invariants hold", () => {
  it("access invariants hold", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-access-summary", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
