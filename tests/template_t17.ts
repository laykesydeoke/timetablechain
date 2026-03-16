import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("template 17", () => {
  it("test 17", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-template-stats", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
