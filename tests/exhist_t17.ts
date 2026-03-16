import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("exhist 17", () => {
  it("test 17", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-exchange-history-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
