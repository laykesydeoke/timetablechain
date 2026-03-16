import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("profile 6", () => {
  it("test 6", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-profile-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
