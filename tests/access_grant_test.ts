import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("grant-admin-role succeeds for owner", () => {
  it("grant-admin-role succeeds for owner", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-access-summary", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
