import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("categ 1", () => {
  it("test 1", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-category-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
