import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("rating 13", () => {
  it("test 13", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-rating-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
