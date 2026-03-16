import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("rating 14", () => {
  it("test 14", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-rating-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
