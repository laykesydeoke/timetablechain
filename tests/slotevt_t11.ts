import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("slotevt 11", () => {
  it("test 11", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-event-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
