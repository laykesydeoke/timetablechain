import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
describe("reporting full", () => {
  it("complete reporting lifecycle", () => {
    const s1 = simnet.callPublicFn("timetablechain", "take-protocol-snapshot", [], simnet.deployer);
    const s2 = simnet.callPublicFn("timetablechain", "take-protocol-snapshot", [], alice);
    const snap0 = simnet.callReadOnlyFn("timetablechain", "get-protocol-snapshot", [Cl.uint(0)], alice);
    const report = simnet.callReadOnlyFn("timetablechain", "get-protocol-report", [], alice);
    const analytics = simnet.callReadOnlyFn("timetablechain", "get-slot-analytics", [], alice);
    expect(s1.result).toBeOk(Cl.uint(0));
    expect(s2.result).toBeOk(Cl.uint(1));
    expect(snap0.result).not.toBeNone();
    expect(report.result).not.toBeNone();
    expect(analytics.result).not.toBeNone();
  });
});
