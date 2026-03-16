import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("rating 10", () => {
  it("test 10", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-rating-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
