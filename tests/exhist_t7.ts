import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("exhist 7", () => {
  it("test 7", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-exchange-history-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
