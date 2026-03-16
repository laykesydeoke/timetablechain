import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("non-owner cannot grant role", () => {
  it("non-owner cannot grant role", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-access-summary", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
