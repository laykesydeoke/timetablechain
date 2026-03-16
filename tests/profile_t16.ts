import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("profile 16", () => {
  it("test 16", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-profile-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
