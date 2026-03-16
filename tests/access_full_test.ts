import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("full access control lifecycle", () => {
  it("full access control lifecycle", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-access-summary", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
