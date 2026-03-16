import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
describe("slot analytics full", () => {
  it("analytics lifecycle", () => {
    simnet.callPublicFn("timetablechain", "authorize-teacher", [Cl.standardPrincipal(alice)], simnet.deployer);
    const isAuth = simnet.callReadOnlyFn("timetablechain", "is-teacher-authorized", [Cl.standardPrincipal(alice)], simnet.deployer);
    const analytics = simnet.callReadOnlyFn("timetablechain", "get-slot-analytics", [], simnet.deployer);
    const lastId = simnet.callReadOnlyFn("timetablechain", "get-last-token-id", [], simnet.deployer);
    expect(isAuth.result).toBeTrue();
    expect(analytics.result).not.toBeNone();
    expect(lastId.result).not.toBeNone();
  });
});
