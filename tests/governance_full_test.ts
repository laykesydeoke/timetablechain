import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";
import { simnet } from "./setup";
const accounts = simnet.getAccounts();
const alice = accounts.get("wallet_1")!;
describe("governance full", () => {
  it("complete governance lifecycle", () => {
    simnet.callPublicFn("timetablechain", "set-max-slots-per-teacher", [Cl.uint(50)], simnet.deployer);
    simnet.callPublicFn("timetablechain", "set-max-slots-per-teacher", [Cl.uint(200)], simnet.deployer);
    const params = simnet.callReadOnlyFn("timetablechain", "get-governance-params", [], simnet.deployer);
    const paramsAlice = simnet.callReadOnlyFn("timetablechain", "get-governance-params", [], alice);
    expect(params.result).not.toBeNone();
    expect(paramsAlice.result).not.toBeNone();
  });
});
