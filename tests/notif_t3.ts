import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
describe("notif 3", () => {
  it("test 3", () => {
    const r = simnet.callReadOnlyFn("timetablechain", "get-notification-params", [], simnet.deployer);
    expect(r.result).not.toBeNone();
  });
});
