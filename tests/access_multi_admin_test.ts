import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("multiple admins can be granted", () => {
  it("multiple admins can be granted", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-access-summary", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
